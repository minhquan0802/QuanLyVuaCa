use tauri_plugin_sql::{Migration, MigrationKind};

/// Ten tep CSDL cuc bo. Tauri dat no trong thu muc du lieu ung dung:
/// %APPDATA%\vn.vuaca.pos\pos.db
///
/// DAY LA BAN DUY NHAT TREN DOI cua cac don chua dong bo len Host.
/// Phai sao luu hang ngay (DAC-TA.md PC-06).
const DB: &str = "sqlite:pos.db";

pub fn run() {
    let migrations = vec![Migration {
        version: 1,
        description: "khoi tao lieu do POS",
        sql: include_str!("../migrations/001_khoi_tao.sql"),
        kind: MigrationKind::Up,
    }];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations(DB, migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("khong khoi dong duoc ung dung POS");
}
