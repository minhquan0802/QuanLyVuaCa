// Cua so console chi hien khi chay ban debug
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    vuaca_pos_lib::run()
}
