const fs = require('fs');
const path = require('path');

const scale = 1.5;

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // We only want to scale values inside StyleSheet.create
    const parts = content.split('StyleSheet.create({');
    if (parts.length < 2) return;
    
    let stylesPart = parts[1];
    
    const propsToScale = [
        'fontSize', 'padding', 'margin', 'marginBottom', 'marginTop', 'marginLeft', 'marginRight',
        'paddingVertical', 'paddingHorizontal', 'width', 'height', 'borderRadius', 'marginVertical'
    ];
    
    propsToScale.forEach(prop => {
        const regex = new RegExp(`(${prop}:\\s*)(\\d+)(?!%)`, 'g');
        stylesPart = stylesPart.replace(regex, (match, p1, p2) => {
            if (prop === 'width' || prop === 'height') {
                if (parseInt(p2) < 20) return match; // don't scale small widths like border widths if they got caught
            }
            return `${p1}${Math.round(parseInt(p2) * scale)}`;
        });
    });

    content = parts[0] + 'StyleSheet.create({' + stylesPart;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Scaled ${filePath}`);
}

const dirs = ['src/screens', 'src/components'];
dirs.forEach(dir => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            processFile(path.join(dir, file));
        }
    });
});
