#[macro_use]
extern crate lazy_static;

use ignite_plugin_utils::editor::{
    emit, get_plugin_meta, ignite, run_node, run_server, terminate_node, terminate_server,
};
use serde::{Deserialize, Serialize};
use std::sync::RwLock;
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct State {
    #[serde(rename(serialize = "isRunning", deserialize = "isRunning"))]
    pub is_running: bool,
    #[serde(rename(serialize = "isBuilding", deserialize = "isBuilding"))]
    pub is_building: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct Meta {
    #[serde(default)]
    pub dist: Option<String>,
    #[serde(default)]
    pub build_debug: Option<MetaBuild>,
    #[serde(default)]
    pub build_release: Option<MetaBuild>,
    #[serde(default)]
    pub log_level: u8,
    #[serde(default)]
    pub blocking_task: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct MetaBuild {
    pub name: String,
    #[serde(default)]
    pub args: Vec<String>,
}

lazy_static! {
    static ref PLAY_TOKEN: RwLock<Option<String>> = RwLock::new(None);
    static ref BUILD_TOKEN: RwLock<Option<String>> = RwLock::new(None);
}

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    match query {
        "start" => {
            if let (Ok(mut play), Ok(build)) = (PLAY_TOKEN.write(), BUILD_TOKEN.read()) {
                if play.is_some() {
                    return Ok(());
                }
                let meta = get_plugin_meta()?;
                if let Ok(meta) = meta.into_serde::<Meta>() {
                    if let Some(directory) = meta.dist {
                        let token = run_server(&directory, 19100, "Play Mode")?;
                        *play = Some(token);
                        let state = State {
                            is_running: true,
                            is_building: build.is_some(),
                        };
                        if let Ok(state) = JsValue::from_serde(&state) {
                            emit("change", state)?;
                        }
                        drop(ignite("?", "play-mode-start", JsValue::UNDEFINED));
                    }
                }
            }
        }
        "stop" => {
            if let (Ok(mut play), Ok(build)) = (PLAY_TOKEN.write(), BUILD_TOKEN.read()) {
                if play.is_none() {
                    return Ok(());
                }
                terminate_server(play.as_ref().unwrap().as_str())?;
                *play = None;
                let state = State {
                    is_running: false,
                    is_building: build.is_some(),
                };
                if let Ok(state) = JsValue::from_serde(&state) {
                    emit("change", state)?;
                }
            }
        }
        // "launch" => {
        //     if let (Ok(play), Ok(build)) = (PLAY_TOKEN.write(), BUILD_TOKEN.write()) {
        //         if play.is_some() || build.is_some() {
        //             return Ok(());
        //         }
        //     }
        // }
        "build" => {
            if let (Ok(play), Ok(mut build)) = (PLAY_TOKEN.read(), BUILD_TOKEN.write()) {
                if build.is_some() {
                    return Ok(());
                }
                let meta = get_plugin_meta()?;
                let (node_name, node_args, blocking_task, log_level) =
                    if let Ok(meta) = meta.into_serde::<Meta>() {
                        if let Some(info) = meta.build_debug {
                            (info.name, info.args, meta.blocking_task, meta.log_level)
                        } else {
                            (
                                "@build".to_owned(),
                                vec![],
                                meta.blocking_task,
                                meta.log_level,
                            )
                        }
                    } else {
                        ("@build".to_owned(), vec![], false, 0)
                    };
                let token = run_node(&node_name, node_args, blocking_task, log_level)?;
                *build = Some(token);
                let state = State {
                    is_running: play.is_some(),
                    is_building: true,
                };
                if let Ok(state) = JsValue::from_serde(&state) {
                    emit("change", state)?;
                }
                drop(ignite("?", "play-mode-build-start", JsValue::UNDEFINED));
            }
        }
        "build-release" => {
            if let (Ok(play), Ok(mut build)) = (PLAY_TOKEN.read(), BUILD_TOKEN.write()) {
                if build.is_some() {
                    return Ok(());
                }
                let meta = get_plugin_meta()?;
                let (node_name, node_args, blocking_task, log_level) =
                    if let Ok(meta) = meta.into_serde::<Meta>() {
                        if let Some(info) = meta.build_release {
                            (info.name, info.args, meta.blocking_task, meta.log_level)
                        } else {
                            (
                                "@build-release".to_owned(),
                                vec![],
                                meta.blocking_task,
                                meta.log_level,
                            )
                        }
                    } else {
                        ("@build-release".to_owned(), vec![], false, 0)
                    };
                let token = run_node(&node_name, node_args, blocking_task, log_level)?;
                *build = Some(token);
                let state = State {
                    is_running: play.is_some(),
                    is_building: true,
                };
                if let Ok(state) = JsValue::from_serde(&state) {
                    emit("change", state)?;
                }
                drop(ignite("?", "play-mode-build-start", JsValue::UNDEFINED));
            }
        }
        "build-cancel" => {
            if let Ok(build) = BUILD_TOKEN.read() {
                if let Some(token) = &*build {
                    terminate_node(&token)?;
                }
            }
        }
        "server-terminated" => {
            if let (Ok(mut play), Ok(build)) = (PLAY_TOKEN.write(), BUILD_TOKEN.read()) {
                if play.is_none() {
                    return Ok(());
                }
                if let Some(token) = data.as_string() {
                    if let Some(value) = play.clone() {
                        if value == token {
                            *play = None;
                            drop(ignite("?", "play-mode-stop", JsValue::UNDEFINED));
                        }
                    }
                    let state = State {
                        is_running: play.is_some(),
                        is_building: build.is_some(),
                    };
                    if let Ok(state) = JsValue::from_serde(&state) {
                        emit("change", state)?;
                    }
                }
            }
        }
        "node-terminated" => {
            if let (Ok(play), Ok(mut build)) = (PLAY_TOKEN.read(), BUILD_TOKEN.write()) {
                if build.is_none() {
                    return Ok(());
                }
                if let Some(token) = data.as_string() {
                    if let Some(value) = build.clone() {
                        if value == token {
                            *build = None;
                            drop(ignite("?", "play-mode-build-stop", JsValue::UNDEFINED));
                        }
                    }
                    let state = State {
                        is_running: play.is_some(),
                        is_building: build.is_some(),
                    };
                    if let Ok(state) = JsValue::from_serde(&state) {
                        emit("change", state)?;
                    }
                }
            }
        }
        _ => {}
    }
    Ok(())
}
