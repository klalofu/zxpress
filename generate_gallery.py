import os
import json

def generate_json():
    games_dir = "games"
    output_file = "games.json"
    
    if not os.path.exists(games_dir):
        print(f"Папка '{games_dir}' не найдена.")
        os.makedirs(games_dir)
        return

    files = os.listdir(games_dir)
    games_data = []

    for filename in files:
        if filename.lower().endswith('.png'):
            base_name = filename[:-4].lower()
            trd_filename = base_name + ".trd"
            
            # Добавляем в список только если есть оба файла
            if trd_filename in files:
                games_data.append({
                    "name": base_name,
                    "img": f"{games_dir}/{base_name}.png",
                    "file": f"{base_name}.trd"
                })

    # Сортировка
    games_data.sort(key=lambda x: x['name'])

    # Запись в JSON
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(games_data, f, indent=4, ensure_ascii=False)
        print(f"Файл {output_file} успешно создан. Игр найдено: {len(games_data)}")
    except IOError as e:
        print(f"Ошибка записи: {e}")

if __name__ == "__main__":
    generate_json()