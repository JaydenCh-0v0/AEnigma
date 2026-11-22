# 青屿 · Qingyu Island

一座用 Three.js 搭建的软陶风可环视小岛。灵感来自 [xiaodao-island](https://github.com/xiaowuzicode/xiaodao-island) 的粘土台地、海面着色与昼夜天空，场景与造型均为原创。

## 功能

- 三层台地海岸、卫星小岛、噪声岩山与观景亭
- 自定义海面着色器：浅滩、白浪、波纹与阳光碎闪
- 软陶树冠、灌木花甸、棕榈、码头、灯塔扫光与漂浮小船
- 夜市摊位、软陶岛民、海鸟、浅海鱼群、珊瑚海草
- 海滩贝壳 / 漂流木、炊烟、萤火虫、篝火与路灯昼夜变化
- 微缩景深 / bloom、点选浮标飞镜与介绍卡
- 可拖动时辰、昼夜流转、海声氛围、预设视角（含夜市）
- 支持拖拽环视 / 滚轮缩放

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
