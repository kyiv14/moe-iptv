import os

# Путь к папке it999 на рабочем столе
folder_path = os.path.expanduser('~/Desktop/it999')

# Получаем список всех файлов в папке
files = os.listdir(folder_path)

# Фильтруем только файлы (исключаем папки)
files = [f for f in files if os.path.isfile(os.path.join(folder_path, f))]

# Путь к выходному текстовому файлу
output_file = os.path.join(folder_path, 'file_names.txt')

# Записываем имена файлов в txt
with open(output_file, 'w', encoding='utf-8') as f:
    for file_name in files:
        f.write(file_name + '\n')

print(f'Имена файлов записаны в {output_file}')
