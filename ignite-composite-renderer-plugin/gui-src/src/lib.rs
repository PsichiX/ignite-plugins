#[macro_use]
extern crate lazy_static;
extern crate oxygengine_composite_renderer as renderer;
extern crate oxygengine_composite_renderer_backend_web as renderer_web;

use renderer::{
    component::{CompositeCamera, CompositeTransform},
    composite_renderer::{
        Command, CompositeRenderer, CompositeRendererResources, RenderState, Renderable,
    },
    math::{Mat2d, Vec2},
};
use renderer_web::WebCompositeRenderer;
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, str::FromStr, sync::RwLock};
use typid::ID;
use wasm_bindgen::prelude::*;
use web_sys::{FontFace, HtmlCanvasElement, HtmlImageElement};

lazy_static! {
    static ref RENDERERS: RwLock<HashMap<String, Renderer>> = RwLock::new(Default::default());
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct Camera {
    #[serde(default)]
    pub order: f32,
    #[serde(default)]
    pub camera: CompositeCamera,
    #[serde(default)]
    pub transform: CompositeTransform,
    #[serde(skip)]
    pub world_transform: Mat2d,
    #[serde(skip)]
    pub world_inverse_transform: Mat2d,
}

impl Camera {
    pub fn screen_to_world_space(&self, point: Vec2) -> Vec2 {
        self.world_inverse_transform * point
    }

    pub fn world_to_screen_space(&self, point: Vec2) -> Vec2 {
        self.world_transform * point
    }
}

struct Renderer {
    pub renderer: WebCompositeRenderer,
    pub cameras: HashMap<String, Camera>,
    pub commands: HashMap<String, Vec<Command<'static>>>,
}

impl Renderer {
    pub fn new(renderer: WebCompositeRenderer) -> Self {
        Self {
            renderer,
            cameras: Default::default(),
            commands: Default::default(),
        }
    }
}

impl Renderer {
    pub fn refresh(&mut self, forced: bool) {
        let old = self.renderer.view_size();
        self.renderer.update_state();
        if forced || self.renderer.view_size() != old {
            self.render();
        }
    }

    pub fn render(&mut self) {
        if let Some(color) = self.renderer.state().clear_color {
            drop(self.renderer.execute(std::iter::once(Command::Draw(
                Renderable::FullscreenRectangle(color),
            ))));
        }
        let view_size = self.renderer.view_size();
        let mut cameras = self.cameras.values().collect::<Vec<_>>();
        cameras.sort_by(|a, b| a.order.partial_cmp(&b.order).unwrap());
        for camera in cameras {
            let matrix = camera.camera.view_matrix(&camera.transform, view_size);
            let transform = {
                let [a, b, c, d, e, f] = matrix.0;
                Command::Transform(a, b, c, d, e, f)
            };
            if camera.camera.tags.is_empty() {
                let commands = std::iter::once(Command::Store)
                    .chain(std::iter::once(transform))
                    .chain(self.commands.values().cloned().flatten())
                    .chain(std::iter::once(Command::Restore));
                drop(self.renderer.execute(commands));
            } else {
                for tag in &camera.camera.tags {
                    if let Some(commands) = self.commands.get(&tag.to_string()) {
                        let commands = std::iter::once(Command::Store)
                            .chain(std::iter::once(transform.clone()))
                            .chain(commands.iter().cloned())
                            .chain(std::iter::once(Command::Restore));
                        drop(self.renderer.execute(commands));
                    }
                }
            }
        }
        for camera in self.cameras.values_mut() {
            camera.world_transform = camera.camera.view_matrix(&camera.transform, view_size);
            camera.world_inverse_transform = camera.world_transform.inverse().unwrap_or_default();
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
struct RenderCommands(HashMap<String, Vec<Command<'static>>>);

#[wasm_bindgen(start)]
pub fn main_js() -> Result<(), JsValue> {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
    Ok(())
}

#[wasm_bindgen]
pub fn renderer_create(
    canvas: HtmlCanvasElement,
    render_state: JsValue,
) -> Result<String, JsValue> {
    let render_state = if render_state.is_null() || render_state.is_undefined() {
        Default::default()
    } else {
        match render_state.into_serde::<RenderState>() {
            Ok(render_state) => render_state,
            Err(error) => return Err(format!("{:#?}", error).into()),
        }
    };
    if let Ok(mut renderers) = RENDERERS.write() {
        let id = ID::<()>::new().to_string();
        let mut renderer = Renderer::new(WebCompositeRenderer::with_state(canvas, render_state));
        renderer.refresh(true);
        renderers.insert(id.clone(), renderer);
        Ok(id)
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn renderer_destroy(id: &str) -> Result<(), JsValue> {
    if let Ok(mut renderers) = RENDERERS.write() {
        renderers.remove(id);
        Ok(())
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn renderer_refresh(id: &str, forced: bool) -> Result<(), JsValue> {
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(id) {
            renderer.refresh(forced);
            Ok(())
        } else {
            Err(format!("Renderer does not exists: {}", id).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_create(renderer: &str, camera: JsValue) -> Result<String, JsValue> {
    let camera = if camera.is_null() || camera.is_undefined() {
        Default::default()
    } else {
        match camera.into_serde::<Camera>() {
            Ok(camera) => camera,
            Err(error) => return Err(format!("{:#?}", error).into()),
        }
    };
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer) {
            let id = ID::<()>::new().to_string();
            renderer.cameras.insert(id.clone(), camera);
            renderer.refresh(true);
            Ok(id)
        } else {
            Err(format!("Renderer does not exists: {}", renderer).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_set(renderer_id: &str, id: &str, camera: JsValue) -> Result<(), JsValue> {
    let camera = if camera.is_null() || camera.is_undefined() {
        Default::default()
    } else {
        match camera.into_serde::<Camera>() {
            Ok(camera) => camera,
            Err(error) => return Err(format!("{:#?}", error).into()),
        }
    };
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer_id) {
            if let Some(instance) = renderer.cameras.get_mut(id) {
                *instance = camera;
                Ok(())
            } else {
                Err(format!("Renderer {} does not have camera: {}", renderer_id, id).into())
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_destroy(renderer: &str, id: &str) -> Result<(), JsValue> {
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer) {
            renderer.cameras.remove(id);
            renderer.refresh(true);
            Ok(())
        } else {
            Err(format!("Renderer does not exists: {}", renderer).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_state(renderer_id: &str, id: &str) -> Result<JsValue, JsValue> {
    if let Ok(renderers) = RENDERERS.read() {
        if let Some(renderer) = renderers.get(renderer_id) {
            if let Some(camera) = renderer.cameras.get(id) {
                match JsValue::from_serde(camera) {
                    Ok(camera) => Ok(camera),
                    Err(error) => Err(format!("{:#?}", error).into()),
                }
            } else {
                Err(format!("Renderer {} does not have camera: {}", renderer_id, id).into())
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a read access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_screen_to_world_space(
    renderer_id: &str,
    id: &str,
    x: f32,
    y: f32,
) -> Result<Box<[f32]>, JsValue> {
    if let Ok(renderers) = RENDERERS.read() {
        if let Some(renderer) = renderers.get(renderer_id) {
            if let Some(camera) = renderer.cameras.get(id) {
                let v = camera.screen_to_world_space((x, y).into());
                Ok(Box::new([v.x, v.y]))
            } else {
                Err(format!("Renderer {} does not have camera: {}", renderer_id, id).into())
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a read access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn camera_world_to_screen_space(
    renderer_id: &str,
    id: &str,
    x: f32,
    y: f32,
) -> Result<Box<[f32]>, JsValue> {
    if let Ok(renderers) = RENDERERS.read() {
        if let Some(renderer) = renderers.get(renderer_id) {
            if let Some(camera) = renderer.cameras.get(id) {
                let v = camera.world_to_screen_space((x, y).into());
                Ok(Box::new([v.x, v.y]))
            } else {
                Err(format!("Renderer {} does not have camera: {}", renderer_id, id).into())
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a read access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn render_commands(renderer: &str, commands: JsValue) -> Result<(), JsValue> {
    if commands.is_null() || commands.is_undefined() {
        return Ok(());
    }
    match commands.into_serde::<RenderCommands>() {
        Ok(RenderCommands(commands)) => {
            if let Ok(mut renderers) = RENDERERS.write() {
                if let Some(renderer) = renderers.get_mut(renderer) {
                    for (tag, commands) in commands {
                        if commands.is_empty() {
                            renderer.commands.remove(&tag);
                        } else {
                            renderer.commands.insert(tag, commands);
                        }
                    }
                    renderer.render();
                    Ok(())
                } else {
                    Err(format!("Renderer does not exists: {}", renderer).into())
                }
            } else {
                Err("Could not acquire a write access to renderers".into())
            }
        }
        Err(error) => Err(format!("{:#?}", error).into()),
    }
}

#[wasm_bindgen]
pub fn render_state(renderer: &str) -> Result<JsValue, JsValue> {
    if let Ok(renderers) = RENDERERS.read() {
        if let Some(renderer) = renderers.get(renderer) {
            match JsValue::from_serde(&renderer.commands) {
                Ok(commands) => Ok(commands),
                Err(error) => Err(format!("{:#?}", error).into()),
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn add_image_resource(
    renderer: &str,
    id: &str,
    resource: HtmlImageElement,
) -> Result<String, JsValue> {
    if resource.is_null() || resource.is_undefined() {
        return Err("Resource cannot be null!".into());
    }
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer) {
            match renderer.renderer.add_resource(id.to_owned(), resource) {
                Ok(id) => Ok(id.to_string()),
                Err(error) => Err(format!("{:#?}", error).into()),
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn remove_image_resource(renderer_id: &str, id: &str) -> Result<HtmlImageElement, JsValue> {
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer_id) {
            match ID::from_str(id) {
                Ok(id) => match renderer.renderer.remove_resource(id) {
                    Ok(resource) => Ok(resource),
                    Err(error) => Err(format!("{:#?}", error).into()),
                },
                Err(error) => Err(error.into()),
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn add_fontface_resource(
    renderer: &str,
    id: &str,
    resource: FontFace,
) -> Result<String, JsValue> {
    if resource.is_null() || resource.is_undefined() {
        return Err("Resource cannot be null!".into());
    }
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer) {
            match renderer.renderer.add_resource(id.to_owned(), resource) {
                Ok(id) => Ok(id.to_string()),
                Err(error) => Err(format!("{:#?}", error).into()),
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}

#[wasm_bindgen]
pub fn remove_fontface_resource(renderer_id: &str, id: &str) -> Result<FontFace, JsValue> {
    if let Ok(mut renderers) = RENDERERS.write() {
        if let Some(renderer) = renderers.get_mut(renderer_id) {
            match ID::from_str(id) {
                Ok(id) => match renderer.renderer.remove_resource(id) {
                    Ok(resource) => Ok(resource),
                    Err(error) => Err(format!("{:#?}", error).into()),
                },
                Err(error) => Err(error.into()),
            }
        } else {
            Err(format!("Renderer does not exists: {}", renderer_id).into())
        }
    } else {
        Err("Could not acquire a write access to renderers".into())
    }
}
