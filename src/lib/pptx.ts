import PptxGenJS from 'pptxgenjs';
import jsPDF from 'jspdf';

// Enhanced Schema to support new layout types
interface SlideContent {
    id: string;
    title: string;
    layout: 'title' | 'bullets' | 'grid_2' | 'grid_3' | 'grid_4' | 'comparison' | 'flow' | 'center' | 'vision_layout';
    content: string[]; // For bullets
    gridItems?: { title?: string; content: string }[]; // For grids
    speakerNotes: string;
    elements?: SlideElement[]; // For VisionDraft
    image?: string; // Generated image URL
}

interface SlideElement {
    type: string;
    content?: string;
    x: number;
    y: number;
    w: number;
    h: number;
    zIndex?: number;
    source?: 'generated' | 'crop';
    color?: string;
    fontSize?: number;
}

interface PresentationData {
    title?: string;
    mainGoal?: string;
    slides?: SlideContent[];
    originalImage?: string;
    themeId?: string;
}

// Helper: Crop and Clean Image (Browser Compatible)
const cropImage = async (base64Image: string, xPct: number, yPct: number, wPct: number, hPct: number): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const sx = (xPct / 100) * img.width;
            const sy = (yPct / 100) * img.height;
            const sWidth = (wPct / 100) * img.width;
            const sHeight = (hPct / 100) * img.height;

            canvas.width = sWidth;
            canvas.height = sHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(base64Image);

            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, sWidth, sHeight);

            // "Remove Impurities" / Simple Thresholding
            const imageData = ctx.getImageData(0, 0, sWidth, sHeight);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                if (brightness > 230) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);

            resolve(canvas.toDataURL('image/png'));
        };
        img.src = base64Image;
    });
};

// Helper to load image as base64 (Browser compatible)
const loadLocalImage = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Image load failed", url, e);
        return null;
    }
};

// Design Constants - Themes
const THEMES: Record<string, any> = {
    premium: {
        colors: {
            primary: '1E1B4B', secondary: '4338CA', accent: '6366F1',
            bg: 'FFFFFF', bgAlt: 'F3F4F6', textMain: '334155', textLight: '94A3B8', shapeFill: 'EEF2FF'
        },
        fonts: { main: 'Helvetica Neue', heading: 'Helvetica Neue' },
        decor: 'modern',
        bgFile: 'premium.jpg'
    },
    minimal: {
        colors: {
            primary: '000000', secondary: '333333', accent: '000000',
            bg: 'FFFFFF', bgAlt: 'FAFAFA', textMain: '171717', textLight: '737373', shapeFill: 'F5F5F5'
        },
        fonts: { main: 'Arial', heading: 'Arial' },
        decor: 'none',
        bgFile: 'minimal.jpg'
    },
    nature: {
        colors: {
            primary: '14532D', secondary: '166534', accent: '22C55E',
            bg: 'FEFCE8', bgAlt: 'F0FDF4', textMain: '3F3F46', textLight: '71717A', shapeFill: 'DCFCE7'
        },
        fonts: { main: 'Georgia', heading: 'Georgia' },
        decor: 'organic',
        bgFile: 'nature.jpg'
    },
    pop: {
        colors: {
            primary: '111827', secondary: 'DB2777', accent: 'F59E0B',
            bg: 'FFFBEB', bgAlt: 'FFF1F2', textMain: '1F2937', textLight: '6B7280', shapeFill: 'FCE7F3'
        },
        fonts: { main: 'Verdana', heading: 'Verdana' },
        decor: 'bold',
        bgFile: 'pop.jpg'
    },
    cyber: {
        colors: {
            primary: '0F172A', secondary: '3B82F6', accent: '06B6D4',
            bg: '020617', bgAlt: '1E293B', textMain: 'E2E8F0', textLight: '94A3B8', shapeFill: '1E293B'
        },
        fonts: { main: 'Courier New', heading: 'Courier New' },
        decor: 'modern',
        bgFile: 'cyber.jpg'
    },
    luxury: {
        colors: {
            primary: '1C1917', secondary: '78716C', accent: 'DCA54C', // Gold
            bg: '0C0A09', bgAlt: '1C1917', textMain: 'F5F5F4', textLight: 'A8A29E', shapeFill: '292524'
        },
        fonts: { main: 'Times New Roman', heading: 'Times New Roman' },
        decor: 'modern',
        bgFile: 'luxury.jpg'
    },
    japanese: {
        colors: {
            primary: '451a03', secondary: '92400e', accent: 'b91c1c',
            bg: 'fffaf0', bgAlt: 'fef2f2', textMain: '451a03', textLight: '78350f', shapeFill: 'ffedd5'
        },
        fonts: { main: 'Yu Mincho', heading: 'Yu Mincho' },
        decor: 'organic',
        bgFile: 'japanese.jpg'
    },
    sky: {
        colors: {
            primary: '0369a1', secondary: '0ea5e9', accent: '38bdf8',
            bg: 'f0f9ff', bgAlt: 'e0f2fe', textMain: '0c4a6e', textLight: '38bdf8', shapeFill: 'e0f2fe'
        },
        fonts: { main: 'Helvetica', heading: 'Helvetica' },
        decor: 'organic',
        bgFile: 'sky.jpg'
    }
};

export const generatePPTX = async (data: PresentationData) => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = 'Logos AI';
    pptx.company = 'Enludus';
    pptx.title = data.title || 'Presentation';

    const themeId = data.themeId || 'premium';
    const THEME = THEMES[themeId] || THEMES['premium'];

    // 1. Title Slide
    if (data.title) {
        const slide = pptx.addSlide();

        // Background Logic using Client-Side Fetch
        try {
            const variant = Math.floor(Math.random() * 5) + 1;
            const stockUrl = `/assets/stock/${themeId}_${variant}.jpg`;
            const fallbackUrl = `/assets/themes/${THEME.bgFile}`;

            // Try stock first, then fallback
            let bgBase64 = await loadLocalImage(stockUrl);
            if (!bgBase64) {
                bgBase64 = await loadLocalImage(fallbackUrl);
            }

            if (bgBase64) {
                slide.addImage({ path: bgBase64, x: 0, y: 0, w: '100%', h: '100%' });
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: 'FFFFFF', transparency: 20 } });
            } else {
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: THEME.colors.bgAlt } });
            }
        } catch (e) {
            console.error("BG generation failed", e);
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: THEME.colors.bgAlt } });
        }

        if (THEME.decor === 'modern') {
            slide.addShape(pptx.ShapeType.ellipse, { x: 7.5, y: 3.5, w: 4, h: 4, fill: { color: THEME.colors.accent, transparency: 90 }, line: { color: 'FFFFFF', width: 0 } });
            slide.addShape(pptx.ShapeType.ellipse, { x: -1, y: -1, w: 3, h: 3, fill: { color: THEME.colors.secondary, transparency: 85 } });
        } else if (THEME.decor === 'organic') {
            slide.addShape(pptx.ShapeType.ellipse, { x: 8, y: 0, w: 5, h: 5, fill: { color: THEME.colors.shapeFill } });
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5, w: '100%', h: 1, fill: { color: THEME.colors.secondary } });
        } else if (THEME.decor === 'bold') {
            slide.addShape(pptx.ShapeType.triangle, { x: 8, y: -1, w: 3, h: 3, fill: { color: THEME.colors.accent }, rotate: 45 });
            slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 0.5, w: 9, h: 4.5, line: { color: THEME.colors.secondary, width: 4 } });
        }

        slide.addText(data.title, {
            x: 1, y: 2, w: '80%', h: 2,
            fontSize: 54, bold: true, color: THEME.colors.primary,
            align: 'left', fontFace: THEME.fonts.heading,
        });

        if (data.mainGoal) {
            slide.addText(data.mainGoal, {
                x: 1, y: 4.2, w: '70%', h: 1,
                fontSize: 24, color: THEME.colors.secondary,
                align: 'left', fontFace: THEME.fonts.main,
            });
            slide.addShape(pptx.ShapeType.line, {
                x: 1, y: 4.1, w: 1, h: 0,
                line: { color: THEME.colors.accent, width: 3 }
            });
        }
    }

    // 2. Agenda Slide
    if (data.slides && data.slides.length > 2) {
        const slide = pptx.addSlide();
        slide.background = { color: 'FFFFFF' };
        slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: THEME.colors.bgAlt } });

        slide.addText('Agenda', {
            x: 0.5, y: 0.4, w: '90%', h: 1,
            fontSize: 40, bold: true, color: THEME.colors.primary,
            fontFace: THEME.fonts.heading
        });

        const items = data.slides.map((s, i) => ({
            text: `${i + 1}. ${s.title}`,
            options: { fontSize: 18, color: THEME.colors.textMain, breakLine: true, paraSpaceBefore: 12 }
        }));

        if (items.length > 6) {
            const mid = Math.ceil(items.length / 2);
            slide.addText(items.slice(0, mid), { x: 1, y: 1.5, w: 4, h: 4, valign: 'top' });
            slide.addText(items.slice(mid), { x: 5.5, y: 1.5, w: 4, h: 4, valign: 'top' });
        } else {
            slide.addText(items, { x: 1, y: 1.5, w: 8, h: 4, valign: 'top' });
        }
    }

    // 3. Content Slides
    if (data.slides) {
        const totalSlides = data.slides.length;
        for (let i = 0; i < totalSlides; i++) {
            const s = data.slides[i];
            const slide = pptx.addSlide();
            slide.background = { color: 'FFFFFF' };
            if (s.speakerNotes) slide.addNotes(s.speakerNotes);

            const footerY = 5.35;
            slide.addText(new Date().toLocaleDateString(), { x: 0.5, y: footerY, w: 2, h: 0.25, fontSize: 10, color: THEME.colors.textLight });
            slide.addText('CONFIDENTIAL', { x: 4, y: footerY, w: 2, h: 0.25, fontSize: 10, color: THEME.colors.textLight, align: 'center', bold: true });
            slide.addText(`${i + 1} / ${totalSlides}`, { x: 9, y: footerY, w: 1, h: 0.25, fontSize: 10, color: THEME.colors.textLight, align: 'right' });

            const progress = (i + 1) / totalSlides;
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: 10, h: 0.08, fill: { color: 'E2E8F0' } });
            slide.addShape(pptx.ShapeType.rect, { x: 0, y: 5.55, w: 10 * progress, h: 0.08, fill: { color: THEME.colors.accent } });

            slide.addText(s.title, {
                x: 0.5, y: 0.4, w: '85%', h: 0.6,
                fontSize: 32, bold: true, color: THEME.colors.primary,
                fontFace: THEME.fonts.heading,
            });
            slide.addShape(pptx.ShapeType.ellipse, {
                x: 0.5, y: 1.1, w: 0.1, h: 0.1,
                fill: { color: THEME.colors.accent }
            });

            if (s.layout === 'vision_layout' && s.elements) {
                const sortedElements = [...s.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
                for (const el of sortedElements) {
                    const slideW = 10; const slideH = 5.625;
                    const xVal = (el.x / 100) * slideW;
                    const yVal = (el.y / 100) * slideH;
                    const wVal = (el.w / 100) * slideW;
                    const hVal = (el.h / 100) * slideH;

                    if (el.type === 'text') {
                        slide.addText(el.content || '', {
                            x: xVal, y: yVal, w: wVal, h: hVal,
                            fontSize: el.fontSize || 18,
                            color: el.color || THEME.colors.textMain,
                            fontFace: THEME.fonts.main,
                            valign: 'top',
                        });
                    } else if (el.type === 'shape') {
                        slide.addShape(pptx.ShapeType.rect, {
                            x: xVal, y: yVal, w: wVal, h: hVal,
                            fill: { color: el.color || THEME.colors.shapeFill },
                            line: { color: THEME.colors.secondary, width: 1 }
                        });
                        if (el.content) {
                            slide.addText(el.content, {
                                x: xVal, y: yVal, w: wVal, h: hVal,
                                fontSize: 14, align: 'center', valign: 'middle', color: THEME.colors.primary
                            });
                        }
                    } else if (el.type === 'image') {
                        // For loop here means we can't simple use await comfortably inside standard forEach unless changed to for...of
                        // Changed loop to for...of above.
                        let imageUrl = '';
                        if (el.source === 'crop' && data.originalImage) {
                            imageUrl = await cropImage(data.originalImage, el.x, el.y, el.w, el.h);
                        } else {
                            // Fetch generated image? Actually, for client side PPTX we can use URL directly if CORS allows,
                            // OR we need to proxy. Pollinations generally allows.
                            // However, pptxgenjs handles URLs usually.
                            const styleSuffix = ', minimalistic vector art, corporate memphis style, trending on dribbble, white background';
                            const prompt = encodeURIComponent((el.content || 'illustration') + styleSuffix);
                            imageUrl = `https://image.pollinations.ai/prompt/${prompt}?width=800&height=600&nologo=true`;
                        }
                        slide.addImage({ path: imageUrl, x: xVal, y: yVal, w: wVal, h: hVal });
                    }
                }
            } else if (s.layout.startsWith('grid_')) {
                const cols = parseInt(s.layout.replace('grid_', ''));
                const spacing = 0.3; const totalW = 9.0; const startX = 0.5;
                const itemW = (totalW - (spacing * (cols - 1))) / cols; const startY = 1.6;

                s.gridItems?.slice(0, cols).forEach((item, idx) => {
                    const x = startX + (itemW + spacing) * idx;
                    slide.addShape(pptx.ShapeType.rect, {
                        x: x, y: startY, w: itemW, h: 3.5,
                        fill: { color: 'FFFFFF' },
                        line: { color: 'E2E8F0', width: 0.5 },
                        shadow: { type: 'outer', color: 'CBD5E1', blur: 3, offset: 3, angle: 45 }
                    });
                    slide.addShape(pptx.ShapeType.rect, {
                        x: x, y: startY, w: itemW, h: 0.1,
                        fill: { color: THEME.colors.secondary }
                    });

                    if (item.title) {
                        slide.addText(item.title, {
                            x: x + 0.2, y: startY + 0.3, w: itemW - 0.4, h: 0.5,
                            fontSize: 18, bold: true, color: THEME.colors.primary, align: 'left'
                        });
                    }
                    slide.addText(item.content, {
                        x: x + 0.2, y: startY + 0.9, w: itemW - 0.4, h: 2.2,
                        fontSize: 15, color: THEME.colors.textMain, valign: 'top'
                    });
                });
            } else if (s.layout === 'center') {
                slide.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: '100%', h: '100%', fill: { color: '1E1B4B' } });
                slide.addShape(pptx.ShapeType.ellipse, { x: 2, y: -2, w: 6, h: 6, fill: { color: '312E81' } });
                slide.addText(s.content[0] || '', {
                    x: 1, y: 2, w: '80%', h: 2,
                    fontSize: 40, bold: true, align: 'center', color: 'FFFFFF'
                });
            } else {
                slide.addShape(pptx.ShapeType.rect, { x: 0.5, y: 1.6, w: 0.05, h: 3.5, fill: { color: 'E2E8F0' } });
                const bulletItems = s.content.map(text => ({
                    text: text,
                    options: {
                        fontSize: 22, color: THEME.colors.textMain, breakLine: true, indentLevel: 0,
                        bullet: { code: '2022', color: THEME.colors.secondary },
                        paraSpaceBefore: 18, lineSpacing: 36
                    }
                }));
                if (bulletItems.length > 0) {
                    slide.addText(bulletItems, { x: 0.8, y: 1.6, w: '85%', h: 4.5, fontFace: THEME.fonts.main, valign: 'top' });
                }

                // Add Generated Image if exists
                if (s.image) {
                    slide.addImage({ path: s.image, x: 7, y: 1.6, w: 2.5, h: 2.5 });
                    // Adjust text width to avoid overlap if image exists
                    // (Simplification: We just place image on right side)
                }
            }
        }
    }

    const endSlide = pptx.addSlide();
    endSlide.background = { color: THEME.colors.primary };
    endSlide.addText('Thank You', { x: 0, y: 2, w: '100%', h: 1, fontSize: 50, color: 'FFFFFF', align: 'center', bold: true });
    endSlide.addText('Q & A', { x: 0, y: 3.2, w: '100%', h: 1, fontSize: 32, color: THEME.colors.accent, align: 'center' });

    const fileName = `Logos_${data.title?.replace(/\s+/g, '_') || 'Presentation'}.pptx`;
    await pptx.writeFile({ fileName });
};

export const generatePDF = async (data: PresentationData) => {
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'pt',
        format: [960, 540] // 16:9 aspect ratio at 72dpi equivalent
    });

    const themeId = data.themeId || 'premium';
    const THEME = THEMES[themeId] || THEMES['premium'];

    // Helper for Hex to RGB
    const hexToRgb = (hex: string) => {
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return [r, g, b];
    };

    const setFillColor = (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        doc.setFillColor(r, g, b);
    };

    const setTextColor = (hex: string) => {
        const [r, g, b] = hexToRgb(hex);
        doc.setTextColor(r, g, b);
    };

    // 1. Title Slide
    if (data.title) {
        // Background
        setFillColor(THEME.colors.bgAlt);
        doc.rect(0, 0, 960, 540, 'F');

        // Decor
        if (THEME.decor === 'modern') {
            setFillColor(THEME.colors.secondary);
            doc.circle(-50, -50, 200, 'F');
        }

        // Title
        setTextColor(THEME.colors.primary);
        doc.setFontSize(54);
        doc.setFont('helvetica', 'bold');
        doc.text(data.title, 80, 200, { maxWidth: 700 });

        if (data.mainGoal) {
            setTextColor(THEME.colors.secondary);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'normal');
            doc.text(data.mainGoal, 80, 400, { maxWidth: 700 });
        }
    }

    // 2. Content Slides
    if (data.slides) {
        data.slides.forEach((s, i) => {
            doc.addPage();

            // Background
            setFillColor('FFFFFF');
            doc.rect(0, 0, 960, 540, 'F');

            // Footer
            setTextColor(THEME.colors.textLight);
            doc.setFontSize(10);
            doc.text(`${i + 1} / ${data.slides!.length}`, 900, 520, { align: 'right' });

            // Title
            setTextColor(THEME.colors.primary);
            doc.setFontSize(32);
            doc.setFont('helvetica', 'bold');
            doc.text(s.title, 50, 60);

            // Divider
            setFillColor(THEME.colors.accent);
            doc.rect(50, 80, 80, 4, 'F');

            // Content
            setTextColor(THEME.colors.textMain);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'normal');

            let yPos = 140;
            if (s.content) {
                s.content.forEach((line) => {
                    doc.text(`• ${line}`, 60, yPos, { maxWidth: 840 });
                    yPos += 30;
                });
            }

            // Add Generated Image if exists
            if (s.image) {
                // jspdf addImage takes base64 or url... url might work if CORS allows, otherwise need proxy.
                // Assuming client side can access the created image URL (pollinations).
                // Note: jsPDF addImage usually requires base64. 
                // We'll skip complex implementation for now to avoid CORS issues in this prototype,
                // or try to add it.
                // doc.addImage(s.image, 'JPEG', 700, 140, 200, 200); 
            }

            // Speaker Notes as annotation? Or separate page? 
            // For now, simple console log or skip.
        });
    }

    const fileName = `Logos_${data.title?.replace(/\s+/g, '_') || 'Presentation'}.pdf`;
    doc.save(fileName);
};
