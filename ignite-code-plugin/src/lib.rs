use ignite_plugin_utils::{
    file_system::{read_string, write_string},
    global::{emit, ensure_window_focused},
    paths::{basename, relative_to_project},
};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Serialize, Deserialize)]
struct PayloadOpen {
    pub path: String,
    pub name: String,
    pub contents: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct PayloadSave {
    pub path: String,
    pub contents: String,
}

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    match query {
        "open-file" => {
            if let Ok(path) = data.into_serde::<String>() {
                let path = if path.starts_with('/') || path.starts_with('\\') {
                    path[1..].to_owned()
                } else {
                    path
                };
                let path = relative_to_project(&path)?;
                let contents = read_string(&path, true)?;
                let name = basename(&path)?;
                let payload = PayloadOpen {
                    path,
                    name,
                    contents,
                };
                if let Ok(value) = JsValue::from_serde(&payload) {
                    ensure_window_focused("Code")?;
                    emit("open-file", value)?;
                }
            }
        }
        "save-file" => {
            if let Ok(payload) = data.into_serde::<PayloadSave>() {
                write_string(&payload.path, &payload.contents, true)?;
            }
        }
        _ => {}
    }
    Ok(())
}
