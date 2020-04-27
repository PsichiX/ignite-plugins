use glob::Pattern;
use ignite_plugin_utils::{editor::emit, file_system::scan_dir, paths::project_path};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Entry {
    pub file_name: String,
    pub file_path: String,
    pub is_directory: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Searcher {
    pub excludes: Vec<String>,
    pub exclude_folders: bool,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Finder {
    pub patterns: Vec<String>,
    pub excludes: Vec<String>,
    pub exclude_folders: bool,
    pub local: bool,
    pub path: String,
}

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    match query {
        "scan-dir" => {
            let root = project_path()?;
            if let Ok(searcher) = data.into_serde::<Searcher>() {
                let path = format!("{}/{}", root, searcher.path);
                let excludes = searcher
                    .excludes
                    .iter()
                    .map(|exclude| exclude.to_lowercase())
                    .collect::<Vec<_>>();
                let globs_excludes = excludes
                    .iter()
                    .map(|exclude| match Pattern::new(&exclude) {
                        Ok(exclude) => Ok(exclude),
                        Err(error) => Err(format!("{:?}", error).into()),
                    })
                    .collect::<Result<Vec<Pattern>, JsValue>>()?;
                let entries = scan_dir(&path, false, true)?
                    .into_iter()
                    .filter_map(|(file_name, file_path, is_directory)| {
                        if searcher.exclude_folders && is_directory {
                            return None;
                        }
                        let fname = file_name.to_lowercase();
                        if !globs_excludes.iter().any(|glob| glob.matches(&fname)) {
                            Some(Entry {
                                file_name,
                                file_path,
                                is_directory,
                            })
                        } else {
                            None
                        }
                    })
                    .collect::<Vec<_>>();
                if let Ok(entries) = JsValue::from_serde(&entries) {
                    emit("entries", entries)?;
                }
            }
        }
        "find" => {
            let root = project_path()?;
            if let Ok(finder) = data.into_serde::<Finder>() {
                let path = format!("{}/{}", root, finder.path);
                let entries = filter(&path, &finder.patterns, &finder.excludes, finder.local)?
                    .into_iter()
                    .filter_map(|(file_name, file_path, is_directory)| {
                        if finder.exclude_folders && is_directory {
                            None
                        } else {
                            Some(Entry {
                                file_name,
                                file_path,
                                is_directory,
                            })
                        }
                    })
                    .collect::<Vec<_>>();
                if let Ok(entries) = JsValue::from_serde(&entries) {
                    emit("entries", entries)?;
                }
            }
        }
        _ => {}
    }
    Ok(())
}

fn filter(
    path: &str,
    patterns: &[String],
    excludes: &[String],
    local: bool,
) -> Result<Vec<(String, String, bool)>, JsValue> {
    let patterns = patterns
        .iter()
        .map(|pattern| pattern.to_lowercase())
        .collect::<Vec<_>>();
    let globs = patterns
        .iter()
        .map(|pattern| match Pattern::new(&pattern) {
            Ok(pattern) => Ok(pattern),
            Err(error) => Err(format!("{:?}", error).into()),
        })
        .collect::<Result<Vec<Pattern>, JsValue>>()?;
    let excludes = excludes
        .iter()
        .map(|exclude| exclude.to_lowercase())
        .collect::<Vec<_>>();
    let globs_excludes = excludes
        .iter()
        .map(|exclude| match Pattern::new(&exclude) {
            Ok(exclude) => Ok(exclude),
            Err(error) => Err(format!("{:?}", error).into()),
        })
        .collect::<Result<Vec<Pattern>, JsValue>>()?;
    Ok(scan_dir(path, !local, true)?
        .into_iter()
        .filter(|(file_name, _, _)| {
            let file_name = file_name.to_lowercase();
            (patterns.iter().any(|pattern| file_name.contains(pattern))
                || globs.iter().any(|glob| glob.matches(&file_name)))
                && !globs_excludes.iter().any(|glob| glob.matches(&file_name))
        })
        .collect::<Vec<_>>())
}
