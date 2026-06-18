import os
import re
import json

def natural_sort_key(text):
    """
    Разделяет строку на текст и числа для правильной сортировки.
    Пример: 'spectrofon13' -> ['spectrofon', 13]
    """
    return [int(s) if s.isdigit() else s.lower() for s in re.split(r'(\d+)', text)]

def generate_json():
    games_dir = "games"
    output_file = "games.json"
    
    if not os.path.exists(games_dir):
        print(f"Папка '{games_dir}' не найдена. Создаю её.")
        os.makedirs(games_dir)
        return

    files = os.listdir(games_dir)
    games_data = []

    for filename in files:
        if filename.lower().endswith('.png'):
            base_name = filename[:-4].lower()
            trd_filename = base_name + ".trd"
            
            if trd_filename in files:
                games_data.append({
                    "name": base_name,
                    "img": f"{games_dir}/{base_name}.png",
                    "file": f"{base_name}.trd"
                })

    # !!! Сортировка с учетом чисел !!!
    games_data.sort(key=lambda x: natural_sort_key(x['name']))

    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(games_data, f, indent=4, ensure_ascii=False)
        print(f"Файл {output_file} успешно создан. Игр: {len(games_data)}")
    except IOError as e:
        print(f"Ошибка записи: {e}")

if __name__ == "__main__":
    generate_json()