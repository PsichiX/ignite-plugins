pub use oxygengine_composite_renderer as oxygengine;
use oxygengine_composite_renderer::{
    component::{CompositeCamera, CompositeTransform},
    composite_renderer::{Command, RenderState},
    math::{Color, Mat2d, Vec2},
};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub type Scalar = f32;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderStateProxy {
    #[serde(default)]
    pub clear_color: Option<Color>,
    #[serde(default = "RenderStateProxy::default_image_smoothing")]
    pub image_smoothing: bool,
    #[serde(default)]
    pub image_source_inner_margin: Scalar,
    #[serde(default)]
    pub triangles_outer_margin: Scalar,
}

impl RenderStateProxy {
    fn default_image_smoothing() -> bool {
        true
    }
}

impl Into<RenderState> for RenderStateProxy {
    fn into(self) -> RenderState {
        RenderState::new(self.clear_color)
            .image_smoothing(self.image_smoothing)
            .image_source_inner_margin(self.image_source_inner_margin)
            .triangles_outer_margin(self.triangles_outer_margin)
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct Camera {
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

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RenderCommands(pub HashMap<String, Vec<Command<'static>>>);
