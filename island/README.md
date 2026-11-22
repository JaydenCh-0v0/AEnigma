# 青屿 · Qingyu Island

一座用 Three.js 搭建的软陶风可环视小岛。灵感来自 [xiaodao-island](https://github.com/xiaowuzicode/xiaodao-island) 的粘土台地、海面着色与昼夜天空，场景与造型均为原创。

## 功能

- 三层台地海岸、卫星小岛、噪声岩山与观景亭
- 自定义海面着色器：浅滩、白浪、波纹与阳光碎闪
- 软陶树冠、花甸、码头、灯塔扫光与漂浮小船
- 可拖动时辰、预设视角，支持拖拽环视 / 滚轮缩放

## 本地运行

```bash
cd island
npm install
npm run dev
```

构建：

```bash
npm run build
npm run preview
```

## 目录

```
island/
  index.html
  src/
    main.js              # 渲染循环与 UI
    style.css            # 品牌叠层与 HUD
    world/               # 地形、海水、天空、植被、地标
    utils/math.js
```
