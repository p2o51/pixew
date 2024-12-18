'use client';

import { useState, useEffect } from 'react';
import { argbFromRgb, themeFromSourceColor, hexFromArgb } from '@material/material-color-utilities';
import html2canvas from 'html2canvas-pro';
import Link from 'next/link';

export default function Home() {
  const [emojiInput, setEmojiInput] = useState('🌟');
  const [color, setColor] = useState('#6750A4');
  const [theme, setTheme] = useState(null);
  const [wallpaperStyle, setWallpaperStyle] = useState({});
  const [density, setDensity] = useState(10);
  const [emojiSize, setEmojiSize] = useState(3);
  const [layoutType, setLayoutType] = useState('grid');
  const [uploadedImage, setUploadedImage] = useState(null);

  // 将输入的emoji字符串转换为emoji数组
  const getEmojiArray = (input) => {
    return Array.from(input).filter(char => {
      // 检查是否为emoji（使用Unicode范围）
      const regex = /\p{Extended_Pictographic}/u;
      return regex.test(char);
    });
  };

  useEffect(() => {
    generateTheme();
  }, [color]);

  const generateTheme = async () => {
    const rgb = hexToRgb(color);
    if (!rgb) return;
    
    const sourceColor = argbFromRgb(rgb.r, rgb.g, rgb.b);
    const generatedTheme = await themeFromSourceColor(sourceColor);
    setTheme(generatedTheme.schemes.light);
    
    const primary = hexFromArgb(generatedTheme.schemes.light.secondaryContainer);
    const onPrimary = hexFromArgb(generatedTheme.schemes.light.primary);
    
    setWallpaperStyle({
      backgroundColor: primary,
      color: onPrimary,
    });
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const generateWallpaper = () => {
    const emojis = [];
    const cols = Math.floor(density * 2);
    const rows = density;
    const spacing = 150;
    
    const emojiArray = getEmojiArray(emojiInput);
    if (emojiArray.length === 0) return emojis;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isOddCol = col % 2 === 1;
        let x, y;
        
        if (layoutType === 'grid') {
          const yOffset = isOddCol ? spacing / 2 : 0;
          x = (col * spacing) / cols;
          y = (row * spacing + yOffset) / rows;
        } else { // prism layout
          // 在 prism 布局中，每行的偏移量逐渐增加
          const rowOffset = (row * spacing / 4) % (spacing / 2);
          x = (col * spacing) / cols + rowOffset;
          y = (row * spacing) / rows;
        }
        
        const index = col % emojiArray.length;
        const currentEmoji = emojiArray[index];
        
        emojis.push(
          <div
            key={`${col}-${row}`}
            className="absolute transform emoji-element"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%)`,
              color: wallpaperStyle.color,
              fontFamily: 'NotoEmoji',
              fontWeight: 700,
              fontSize: `${emojiSize}rem`,
              lineHeight: 1,
            }}
          >
            {currentEmoji}
          </div>
        );
      }
    }
    return emojis;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const downloadWallpaper = () => {
    const wallpaperElement = document.getElementById('wallpaper');
    
    html2canvas(wallpaperElement, {
      useCORS: true,
      scale: 2, // Increase quality
      allowTaint: true,
      backgroundColor: wallpaperStyle.backgroundColor || '#ffffff',
      onclone: (clonedDoc) => {
        // Force all colors to be in hex/rgb format in the cloned document
        const elements = clonedDoc.getElementsByClassName('emoji-element');
        Array.from(elements).forEach(el => {
          // Ensure color is in hex format
          if (el.style.color.includes('oklch')) {
            el.style.color = wallpaperStyle.color || '#000000';
          }
        });
      }
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'wallpaper.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error('Error generating wallpaper:', err);
    });
  };

  return (
    <main className="min-h-screen p-8 bg-base-100">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-base-content">Pixew</h1>
        
        <div className="card bg-base-200 shadow-xl p-6 space-y-4">
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Emojis</span>
            </label>
            <input
              type="text"
              value={emojiInput}
              onChange={(e) => setEmojiInput(e.target.value)}
              className="input input-bordered w-full"
              style={{ fontFamily: 'NotoEmoji', fontWeight: 500 }}
              placeholder="输入一个或多个emoji..."
            />
          </div>
          
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Color</span>
            </label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-12 w-full rounded-lg cursor-pointer"
            />
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Emoji Density ({density}x{Math.floor(density * 2)})</span>
            </label>
            <input
              type="range"
              min="5"
              max="15"
              step="1"
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
              className="range range-primary"
            />
            <div className="w-full flex justify-between text-xs px-2 mt-1">
              <span>Sparse</span>
              <span>Medium</span>
              <span>Dense</span>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Emoji Size ({emojiSize})</span>
            </label>
            <input
              type="range"
              min="1"
              max="6"
              step="0.5"
              value={emojiSize}
              onChange={(e) => setEmojiSize(Number(e.target.value))}
              className="range range-primary"
            />
            <div className="w-full flex justify-between text-xs px-2 mt-1">
              <span>Small</span>
              <span>Medium</span>
              <span>Large</span>
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Layout Type</span>
            </label>
            <select 
              className="select select-bordered w-full"
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value)}
            >
              <option value="grid">Grid Layout</option>
              <option value="prism">Prism Layout</option>
            </select>
          </div>

          {/* 添加上传按钮 */}
          <div className="form-control w-full">
            <label className="label">
              <span className="label-text">Upload Image</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          {/* 添加下载按钮 */}
          <button
            onClick={downloadWallpaper}
            className="btn btn-primary w-full"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Wallpaper
          </button>
        </div>

        <div 
          id="wallpaper"
          className="relative aspect-[9/16] overflow-hidden"
          style={{
            ...wallpaperStyle,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '1.5rem',
          }}
        >
          {generateWallpaper()}
          {uploadedImage && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2/3">
              <img
                src={uploadedImage}
                alt="Uploaded"
                style={{
                  width: '100%',
                  height: 'auto',
                  borderRadius: '3rem',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
              />
            </div>
          )}
        </div>

        <footer className="flex flex-col items-start justify-center gap-2 text-gray-500">
          <p className="text-lg">
            Thanks for{' '}
            <Link href="https://fonts.google.com/noto/specimen/Noto+Emoji" className="hover:text-blue-500 transition-colors" target="_blank">
              Great Noto Emoji
            </Link>
            , and{' '}
            <Link href="https://m3.material.io/styles/color/system/overview" className="hover:text-blue-500 transition-colors" target="_blank">
              Great Material Colors
            </Link>
            .
          </p>
          <Link 
            href="https://twitter.com/GojyuuPlusOne" 
            target="_blank" 
            className="flex items-center gap-1 hover:text-blue-500 transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="currentColor"
            >
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            @GojyuuPlusOne
          </Link>
        </footer>
      </div>
    </main>
  );
}
