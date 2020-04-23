use ignite_plugin_utils::{console::log, global::ignite};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Payload {
    pub message: String,
}

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    match query {
        "editor-loaded" => {
            log("EDITOR HAS LOADED");
            let payload = Payload {
                message: "WEWOWEWOWEWO!!!".to_owned(),
            };
            if let Ok(payload) = JsValue::from_serde(&payload) {
                ignite("ignite-plugin-template", "alert", payload)?;
            }
        }
        "alert" => {
            if let Ok(payload) = data.into_serde::<Payload>() {
                log(&payload.message);
            }
            ignite("?", "ping", JsValue::UNDEFINED)?;
        }
        "ping" => {
            log("pong");
        }
        _ => {}
    }
    Ok(())
}
