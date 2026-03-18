import os
import re

def remove_comments(text):
    # 1. Block comments (/* ... */) and Javadoc (/** ... */)
    # This non-greedy regex matches block comments
    text = re.sub(r'/\*[\s\S]*?\*/', '', text)
    
    # 2. Line comments (// ...)
    lines = text.split('\n')
    new_lines = []
    
    for line in lines:
        if 'http://' in line or 'https://' in line:
            new_lines.append(line)
            continue
            
        in_string = False
        comment_start = -1
        
        for i in range(len(line) - 1):
            if line[i] == '"' and (i == 0 or line[i-1] != '\\'):
                in_string = not in_string
            elif not in_string and line[i] == '/' and line[i+1] == '/':
                comment_start = i
                break
                
        if comment_start != -1:
            # Only keep the part before the comment
            line_content = line[:comment_start].rstrip()
            if line_content: # Don't add empty lines if the whole line was a comment
                new_lines.append(line_content)
        else:
            new_lines.append(line)
            
    # Remove multiple consecutive blank lines
    result = '\n'.join(new_lines)
    result = re.sub(r'\n\s*\n', '\n\n', result)
    return result

def process_directory(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.java'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                new_content = remove_comments(content)
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)

if __name__ == '__main__':
    process_directory('src/main/java')
    process_directory('src/test/java')
