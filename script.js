// DOM要素の取得
const treeDisplay = document.getElementById('tree-svg');
const stageDisplay = document.getElementById('stage-display');
const totalValueDisplay = document.getElementById('total-value-display');
const growingMessage = document.getElementById('growing-message');
const spreadsheetIdInput = document.getElementById('spreadsheet-id');
const minThresholdInput = document.getElementById('min-threshold');
const maxThresholdInput = document.getElementById('max-threshold');
const manualValueInput = document.getElementById('manual-value');
const fetchDataBtn = document.getElementById('fetch-data-btn');
const demoGrowthBtn = document.getElementById('demo-growth-btn');
const saveImageBtn = document.getElementById('save-image-btn');
const seasonBtns = document.querySelectorAll('.season-btn');
const welcomeGuide = document.getElementById('welcome-guide');
const guideCloseBtn = document.getElementById('guide-close-btn');

// 状態管理用の変数
let totalValue = 0;
let currentStage = 0;
let displayStage = 0;
let minThreshold = 0;
let maxThreshold = 150;
let isAnimating = false;
let currentSeason = 'spring';
let animationId = null;

// 初期化
function init() {
  // ローカルストレージからデータを読み込む
  loadFromLocalStorage();
  
  // URLパラメータを確認
  const urlParams = new URLSearchParams(window.location.search);
  const sheetIdParam = urlParams.get('sheetId');
  if (sheetIdParam) {
    spreadsheetIdInput.value = sheetIdParam;
  }
  
  // 初回訪問ガイドの表示
  if (!localStorage.getItem('hasVisitedBefore')) {
    welcomeGuide.classList.remove('hidden');
    localStorage.setItem('hasVisitedBefore', 'true');
  }
  
  // イベントリスナーの設定
  setupEventListeners();
  
  // 木を描画
  updateTreeDisplay();
  
  // 表示を更新
  updateDisplays();
}

// イベントリスナーの設定
function setupEventListeners() {
  // データ取得ボタン
  fetchDataBtn.addEventListener('click', () => {
    const sheetId = spreadsheetIdInput.value.trim();
    if (!sheetId) {
      alert('スプレッドシートIDを入力してください');
      return;
    }
    
    // 本来はここでGoogleスプレッドシートからデータを取得しますが、
    // 簡易版ではランダムな値を生成します
    const randomValue = Math.floor(Math.random() * maxThreshold);
    setTotalValue(randomValue);
    alert(`データを取得しました: ${randomValue} （デモ用の値です）`);
  });
  
  // 成長デモボタン
  demoGrowthBtn.addEventListener('click', demonstrateGrowth);
  
  // 画像保存ボタン
  saveImageBtn.addEventListener('click', saveTreeAsImage);
  
  // 手動入力
  manualValueInput.addEventListener('input', () => {
    const value = parseInt(manualValueInput.value) || 0;
    setTotalValue(value);
  });
  
  // 閾値の変更
  minThresholdInput.addEventListener('input', () => {
    minThreshold = parseInt(minThresholdInput.value) || 0;
    updateTreeStage();
    saveToLocalStorage();
  });
  
  maxThresholdInput.addEventListener('input', () => {
    maxThreshold = parseInt(maxThresholdInput.value) || 150;
    updateTreeStage();
    saveToLocalStorage();
  });
  
  // 季節ボタン
  seasonBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentSeason = btn.dataset.season;
      
      // アクティブなボタンのスタイルを更新
      seasonBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      updateTreeDisplay();
      saveToLocalStorage();
    });
    
    // 初期の季節ボタンをアクティブにする
    if (btn.dataset.season === currentSeason) {
      btn.classList.add('active');
    }
  });
  
  // ガイドを閉じるボタン
  guideCloseBtn.addEventListener('click', () => {
    welcomeGuide.classList.add('hidden');
  });
}

// 合計値を設定する
function setTotalValue(value) {
  totalValue = value;
  manualValueInput.value = value;
  updateTreeStage();
  saveToLocalStorage();
}

// 木の成長段階を更新する
function updateTreeStage() {
  let targetStage;
  
  if (totalValue <= minThreshold) {
    targetStage = 0;
  } else if (totalValue >= maxThreshold) {
    targetStage = 30;
  } else {
    const range = maxThreshold - minThreshold;
    const step = range / 30;
    targetStage = Math.floor((totalValue - minThreshold) / step);
    targetStage = Math.min(30, Math.max(0, targetStage));
  }
  
  // 段階が変わったらアニメーションを開始
  if (targetStage !== currentStage) {
    animateGrowth(targetStage);
  }
}

// 木の成長をアニメーションで表現
function animateGrowth(targetStage) {
  // 既存のアニメーションをキャンセル
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  
  const startStage = displayStage;
  const startTime = performance.now();
  const duration = 2000; // 2秒間のアニメーション
  
  // アニメーション中のフラグを設定
  isAnimating = true;
  growingMessage.classList.remove('hidden');
  
  // アニメーション関数
  function animation(currentTime) {
    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // イージング関数
    const easedProgress = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    // 表示ステージを更新
    displayStage = startStage + (targetStage - startStage) * easedProgress;
    
    // 木の表示を更新
    updateTreeDisplay();
    updateDisplays();
    
    // アニメーションが完了していなければ続ける
    if (progress < 1) {
      animationId = requestAnimationFrame(animation);
    } else {
      // アニメーション完了
      displayStage = targetStage;
      currentStage = targetStage;
      isAnimating = false;
      growingMessage.classList.add('hidden');
      animationId = null;
      
      // 最終的な木の状態を表示
      updateTreeDisplay();
      updateDisplays();
    }
  }
  
  // アニメーションを開始
  animationId = requestAnimationFrame(animation);
}

// 木のSVGを描画
function updateTreeDisplay() {
  // 季節ごとの色と特性を設定
  const seasonStyles = {
    spring: {
      skyColor: "#B7E9F7",
      groundColor: "#8D6E63",
      leafColor: `rgb(${Math.max(0, 230 - displayStage * 3)}, ${150 + displayStage * 3}, ${Math.max(0, 150 - displayStage * 3)})`
    },
    summer: {
      skyColor: "#87CEEB",
      groundColor: "#8B4513",
      leafColor: `rgb(${Math.max(0, 100 - displayStage * 2)}, ${120 + displayStage * 5}, ${Math.max(0, 80 - displayStage * 3)})`
    },
    autumn: {
      skyColor: "#E8D0A9",
      groundColor: "#795548",
      leafColor: `rgb(${180 + displayStage * 2}, ${100 + displayStage * 1}, ${Math.max(0, 50 - displayStage * 1)})`
    },
    winter: {
      skyColor: "#D6EAF8",
      groundColor: "#FAFAFA",
      leafColor: `rgb(${Math.max(0, 100 - displayStage * 1)}, ${Math.max(0, 100 - displayStage * 1)}, ${Math.max(0, 100 - displayStage * 1)})`
    }
  };
  
  // 現在の季節のスタイルを取得
  const style = seasonStyles[currentSeason];
  
  // 木の特性を計算
  const treeHeight = 100 + (displayStage * 7);
  const trunkWidth = 10 + (displayStage * 0.5);
  const foliageSize = displayStage * 4;
  const foliageCount = Math.min(20, Math.max(1, Math.floor(displayStage / 2) + 1));
  
  // 風の効果（アニメーション中のみ）
  const windEffect = isAnimating ? Math.sin(Date.now() / 1000) * 3 : 0;
  
  // SVGを構築
  let svg = `
    <svg viewBox="0 0 300 300" width="100%" height="100%">
      <!-- 空 -->
      <rect x="0" y="0" width="300" height="250" fill="${style.skyColor}" />
      
      <!-- 太陽 -->
      <circle cx="250" cy="50" r="20" fill="#FFD700" />
      
      <!-- 地面 -->
      <rect x="0" y="250" width="300" height="50" fill="${style.groundColor}" />
  `;
  
  // 季節特有の効果
  if (currentSeason === 'winter') {
    // 雪
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 300;
      const y = Math.random() * 240;
      const size = 1 + Math.random() * 2;
      svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="white" opacity="0.8" />`;
    }
  } else if (currentSeason === 'autumn') {
    // 落ち葉
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * 300;
      const y = 230 + Math.random() * 20;
      svg += `<circle cx="${x}" cy="${y}" r="2" fill="#8B4513" />`;
    }
  } else if (currentSeason === 'spring') {
    // 春には桜の花びらを追加
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 300;
      const y = Math.random() * 240;
      const size = 2 + Math.random() * 1;
      svg += `<circle cx="${x}" cy="${y}" r="${size}" fill="#FFCCD5" opacity="0.7" />`;
    }
  } else if (currentSeason === 'summer') {
    // 夏には太陽の光線を追加
    for (let i = 0; i < 8; i++) {
      const angle = i * (Math.PI / 4);
      const x1 = 250;
      const y1 = 50;
      const length = 15 + Math.random() * 10;
      const x2 = x1 + Math.cos(angle) * length;
      const y2 = y1 + Math.sin(angle) * length;
      svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFD700" stroke-width="2" />`;
    }
  }
  
  // 木の幹
  svg += `
    <path 
      d="M${150 - trunkWidth/2 + windEffect} 250 
         Q${150 + windEffect} ${250 - treeHeight/2} 
           ${150 + trunkWidth/4 + windEffect} ${250 - treeHeight}"
      stroke="#8B4513"
      stroke-width="${trunkWidth}"
      fill="none"
    />
  `;
  
  // 葉っぱ/枝
  for (let i = 0; i < foliageCount; i++) {
    const angle = (i / foliageCount) * Math.PI * 2;
    const distance = foliageSize + (i % 3) * 8;
    const wobble = isAnimating ? Math.sin(Date.now() / 500 + i) * 3 : 0;
    const x = 150 + Math.cos(angle) * distance + wobble + windEffect;
    const y = 200 - (displayStage * 2) + Math.sin(angle) * distance;
    
    svg += `
      <circle 
        cx="${x}"
        cy="${y}"
        r="${2 + (displayStage / 6)}"
        fill="${style.leafColor}"
      />
    `;
  }
  
  // 主な葉の集合体
  svg += `
    <ellipse 
      cx="${150 + windEffect}"
      cy="${200 - displayStage * 2}"
      rx="${20 + foliageSize}"
      ry="${15 + foliageSize}"
      fill="${style.leafColor}"
    />
  `;
  
  // 成長段階に応じた葉の追加
  if (displayStage > 10) {
    svg += `
      <ellipse 
        cx="${150 + windEffect * 1.2}"
        cy="${180 - displayStage * 1.5}"
        rx="${15 + foliageSize * 0.7}"
        ry="${12 + foliageSize * 0.7}"
        fill="${style.leafColor}"
      />
    `;
  }
  
  if (displayStage > 20) {
    svg += `
      <ellipse 
        cx="${150 + windEffect * 1.5}"
        cy="${160 - displayStage}"
        rx="${12 + foliageSize * 0.5}"
        ry="${10 + foliageSize * 0.5}"
        fill="${style.leafColor}"
      />
    `;
  }
  
  // SVGを閉じる
  svg += `</svg>`;
  
  // SVGをツリー表示領域に挿入
  treeDisplay.innerHTML = svg;
}

// 表示を更新
function updateDisplays() {
  stageDisplay.textContent = Math.round(displayStage);
  totalValueDisplay.textContent = totalValue;
}

// 成長をデモする関数
async function demonstrateGrowth() {
  // 最小値から最大値まで段階的に増加
  const startValue = parseInt(minThresholdInput.value) || 0;
  const endValue = parseInt(maxThresholdInput.value) || 150;
  const step = 5;
  
  for (let i = startValue; i <= endValue; i += step) {
    setTotalValue(i);
    // 次の値を設定する前に少し待つ
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 木を画像として保存する関数
function saveTreeAsImage() {
  const svgData = treeDisplay.innerHTML;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // キャンバスのサイズを設定
  canvas.width = 300;
  canvas.height = 300;
  
  // SVGをイメージに変換
  const img = new Image();
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(svgBlob);
  
  img.onload = function() {
    // 背景を白で描画
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // SVGイメージを描画
    ctx.drawImage(img, 0, 0);
    
    // 日付を追加
    ctx.font = '12px Arial';
    ctx.fillStyle = 'black';
    ctx.fillText(`成長段階: ${Math.round(displayStage)}/30 - ${new Date().toLocaleDateString()}`, 10, 290);
    
    // 画像として保存
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `友情の木_${new Date().toLocaleDateString()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // URL.revokeObjectURLでメモリリークを防止
    URL.revokeObjectURL(url);
  };
  
  img.src = url;
}

// ローカルストレージにデータを保存
function saveToLocalStorage() {
  const data = {
    totalValue,
    currentStage,
    displayStage,
    minThreshold,
    maxThreshold,
    currentSeason
  };
  
  try {
    localStorage.setItem('treeData', JSON.stringify(data));
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗しました:', error);
  }
}

// ローカルストレージからデータを読み込む
function loadFromLocalStorage() {
  try {
    const savedData = localStorage.getItem('treeData');
    if (savedData) {
      const data = JSON.parse(savedData);
      
      totalValue = data.totalValue || 0;
      currentStage = data.currentStage || 0;
      displayStage = data.displayStage || 0;
      minThreshold = data.minThreshold || 0;
      maxThreshold = data.maxThreshold || 150;
      currentSeason = data.currentSeason || 'spring';
      
      // 入力フィールドを更新
      manualValueInput.value = totalValue;
      minThresholdInput.value = minThreshold;
      maxThresholdInput.value = maxThreshold;
    }
  } catch (error) {
    console.error('ローカルストレージからの読み込みに失敗しました:', error);
  }
}

// アプリを初期化
document.addEventListener('DOMContentLoaded', init);
