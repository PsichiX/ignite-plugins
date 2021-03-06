use wasm_bindgen::prelude::*;

pub mod editor {
    use super::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn ignite(plugin: &str, query: &str, data: JsValue) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = editor)]
        pub fn ignite_delayed(plugin: &str, query: &str, data: JsValue, milliseconds: usize);

        #[wasm_bindgen(js_namespace = editor, js_name = run_node, catch)]
        fn run_node_inner(
            name: &str,
            args: Box<[JsValue]>,
            blocking: bool,
            log_level: u8,
        ) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn terminate_node(token: &str) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn is_node_running(token: &str) -> Result<bool, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn run_server(directory: &str, port: usize, name: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn run_proxy_server(
            address: &str,
            port: usize,
            name: &str,
            opts: JsValue,
        ) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn terminate_server(token: &str) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn is_server_running(token: &str) -> Result<bool, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn emit(id: &str, data: JsValue) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn ensure_window_focused(name: &str) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn get_plugin_meta() -> Result<JsValue, JsValue>;

        #[wasm_bindgen(js_namespace = editor, catch)]
        pub fn set_plugin_meta(data: JsValue) -> Result<(), JsValue>;
    }

    pub fn run_node(
        name: &str,
        args: Vec<String>,
        blocking: bool,
        log_level: u8,
    ) -> Result<String, JsValue> {
        let args = args
            .into_iter()
            .map(|arg| arg.into())
            .collect::<Vec<JsValue>>()
            .into_boxed_slice();
        run_node_inner(name, args, blocking, log_level)
    }
}

pub mod console {
    use super::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = console)]
        pub fn log(message: &str);
    }

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = console)]
        pub fn warn(message: &str);
    }

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = console)]
        pub fn error(message: &str);
    }
}

pub mod file_system {
    use super::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn read_string(path: &str, project_only: bool) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn read_buffer(path: &str, project_only: bool) -> Result<Vec<u8>, JsValue>;

        #[wasm_bindgen(js_namespace = file_system, js_name = write, catch)]
        pub fn write_string(path: &str, contents: &str, project_only: bool) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, js_name = write, catch)]
        pub fn write_buffer(path: &str, contents: &[u8], project_only: bool)
            -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, js_name = scan_dir, catch)]
        fn scan_dir_inner(
            path: &str,
            recursively: bool,
            project_only: bool,
        ) -> Result<JsValue, JsValue>;

        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn request_save(buffer: &[u8], title: &str, extension: &str) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, js_name = request_import, catch)]
        pub fn request_import_inner(
            title: &str,
            extensions: Box<[JsValue]>,
            destination_dir: &str,
        ) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn copy_path(
            source_path: &str,
            destination_path: &str,
            project_only: bool,
            overrideName: bool,
        ) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn move_path(
            source_path: &str,
            destination_path: &str,
            project_only: bool,
            overrideName: bool,
        ) -> Result<(), JsValue>;

        #[wasm_bindgen(js_namespace = file_system, catch)]
        pub fn delete_path(path: &str, project_only: bool) -> Result<(), JsValue>;
    }

    /// (name, path, is directory)
    pub fn scan_dir(
        path: &str,
        recursively: bool,
        project_only: bool,
    ) -> Result<Vec<(String, String, bool)>, JsValue> {
        match scan_dir_inner(path, recursively, project_only)?
            .into_serde::<Vec<(String, String, bool)>>()
        {
            Ok(result) => Ok(result),
            Err(error) => Err(format!("{:?}", error).into()),
        }
    }

    pub fn request_import(
        title: &str,
        extensions: Vec<String>,
        destination_dir: &str,
    ) -> Result<(), JsValue> {
        let extensions = extensions
            .into_iter()
            .map(|ext| ext.into())
            .collect::<Vec<JsValue>>()
            .into_boxed_slice();
        request_import_inner(title, extensions, destination_dir)
    }
}

pub mod paths {
    use super::*;

    #[wasm_bindgen]
    extern "C" {
        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn join(a: &str, b: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn resolve(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn relative(a: &str, b: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn is_absolute(path: &str) -> Result<bool, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn basename(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn dirname(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn extname(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn app_path() -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn plugin_path() -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn project_path() -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn relative_to_app(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn relative_to_plugin(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn relative_to_project(path: &str) -> Result<String, JsValue>;

        #[wasm_bindgen(js_namespace = paths, catch)]
        pub fn is_trusted(path: &str) -> Result<bool, JsValue>;
    }
}
