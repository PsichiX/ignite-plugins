use ignite_plugin_utils::{
    file_system::{request_save, write_buffer},
    paths::relative_to_project,
};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn query(query: &str, data: JsValue) -> Result<(), JsValue> {
    match query {
        "screenshot" | "screenshot-preview" => {
            if let Ok(data) = data.into_serde::<String>() {
                if data.starts_with("data:image/png;base64,") {
                    if let Ok(data) = base64::decode(&data[22..]) {
                        if let Ok(image) = image::load_from_memory(&data) {
                            let mut result = vec![];
                            if image
                                .thumbnail(512, 512)
                                .write_to(&mut result, image::ImageOutputFormat::Png)
                                .is_ok()
                            {
                                write_buffer(&relative_to_project("preview.png")?, &result, true)?;
                            }
                        }
                        if query == "screenshot" {
                            request_save(&data, "Save screenshot", "png")?;
                        }
                    }
                }
            }
        }
        _ => {}
    }
    Ok(())
}
