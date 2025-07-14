---
title: 论文笔记
date: 2025-06-06 14:00:00 +0800
categories: [论文]
tags: [深度学习， deepinsight]     # TAG names should always be lowercase
author: lc
description: >-
    深度学习论文笔记。
math: true
# mermaid: true
# image:
#   path: /resources/xxxxxx.png
#   lqip: data:image/webp;base64,UklGRpoAAABXRUJQVlA4WAoAAAAQAAAADwAABwAAQUxQSDIAAAARL0AmbZurmr57yyIiqE8oiG0bejIYEQTgqiDA9vqnsUSI6H+oAERp2HZ65qP/VIAWAFZQOCBCAAAA8AEAnQEqEAAIAAVAfCWkAALp8sF8rgRgAP7o9FDvMCkMde9PK7euH5M1m6VWoDXf2FkP3BqV0ZYbO6NA/VFIAAAA
#   alt: Responsive rendering of Chirpy theme on multiple devices
# pin: true
# media_subpath: '/resources/'
# render_with_liquid: false
---

# Deep Insight

这篇论文19年发布，至今400+引用。  
可以将非图像数据转化为图像数据，然后可以输入到对图像数据敏感的模型当中，据说效果很好，但我在mac上配环境失败了，所以还没跑代码。（别用mac）github上搜索pydeepinsight就能搜到。  
具体的转换方法参考这个流程图：  
```text
结构化数据 X (n × d)
        ↓
  特征降维 (PCA / t-SNE)
        ↓
  特征坐标映射 (d个特征 → d个2D点)
        ↓
   离散化 (Discretization to pixels)
        ↓
  特征像素表 (Feature-to-pixel map)
        ↓
每个样本生成一张图像 (按照该像素表)
        ↓
    图像 → CNN (训练 / 推理)
```
其中最重要的就是特征坐标映射这一步：中心思想是如果两个特征相似度/相关性很高，那么在图像中就适合被放在一块。这样就会形成聚落。  
更具体地讲，如果有n个特征，m行样本，则首先使用降维方法（可选tsne、kpca、umap）将其降维为n个特征，2行的数据。然后将这两行数据标准化（标准化方法可以探讨，做对数什么的），映射到二维图像上。像素的灰度值就是每一列的均值。（这里的均值也要标准化以消除量纲影响）  
所以图像上每一个像素点对应一个特征，像素点的灰度值对应特征的均值。  
脑电信号数据是多通道时间序列数据，通道数虽然不多，但是可以通过滑动窗口提取数据，把每一个时间窗口视为一个样本，有发作和没发作两种标签，这样可以生成很多图像进行训练。  
总的来讲是一个很有新意的数据处理方法。  

# Sparsetsf

这好像是是本校学生的论文，提出了一种从长序列周期性时间序列数据中提取数据进行训练的稀疏的方法，并应用到了预测模型上。虽然本项目应该是分类任务，但是可以通过计算相似度来将预测结果转换为分类结果，所以我就看了这篇。它厉害的地方在于将LSTF任务模型参数降低了1～4个数量级，且能保持sota性能，适合边缘计算设备。  
具体原理是：将时间序列数据按周期划分，然后把每一个周期内相位相同的数据视为一个序列，这样就构建出了很多子序列（具体个数看采样率和窗口大小）。对于这些序列，应用**一个共享的线性层矩阵**去**预测所有序列的下一个值**。这里的假设就是所有子序列都有相同的趋势，模型可以去学习它们的共同趋势。  
虽然很神奇，但是这模型就是可以跑到sota数据，我感觉怪怪的...   

---

### 📘 分享主题：

**SparseTSF 对癫痫脑电信号处理的启发性分析**

---

### 🔍 一、SparseTSF 核心思想简述

* **SparseTSF** 是一种用于**长时间序列预测**的极轻量模型（<1000个参数）；
* 它提出了一个关键技术：**Cross-Period Sparse Forecasting**，即：

  * **周期性解耦**：把时间序列按照已知周期 $w$ 切分成若干子序列；
  * **稀疏预测建模**：对每个子序列只用一个共享的线性层建模；
  * **趋势建模优先**：周期性被结构化解耦，模型重点提取趋势变化；
* 效果上，SparseTSF 在主流 LTSF 任务上实现了**SOTA级别的性能**，而模型大小却小几个数量级。

---

### 💡 二、对癫痫脑电信号研究的启发

#### ✅ 1. **结构性建模思路值得迁移**

* 脑电信号具有明显的\*\*节律性（如alpha、beta波）\*\*和特定病理周期（如癫痫爆发节律）；
* SparseTSF 启示我们：可以将 EEG 信号**按周期切分**，再对**同一周期点构成的子序列建模**；
* 例如：将每秒 EEG 划分为若干固定片段（如每100ms），每段做独立趋势编码。

#### ✅ 2. **共享子模型+趋势建模有助于轻量高效识别**

* 癫痫检测任务中，我们关心的是**趋势性病理变化**；
* SparseTSF 的参数共享机制说明：**可用统一小模型抽取周期趋势特征，再进行分类**；
* 这对部署在边缘设备或可穿戴设备上的**高效、实时EEG处理系统**特别有价值。

#### ✅ 3. **周期解耦有助于抗干扰和泛化**

* EEG 数据中存在大量伪差、噪声；
* 类似 SparseTSF 中的滑动聚合、周期切分、局部归一化等方法，可增强模型鲁棒性与迁移能力；
* 特别适合在**跨病人或跨时间段建模中提取稳定结构**。

---

### 🧭 三、可行的迁移方向

| 目标                           | 对应思路                               |
| ------------------------------ | -------------------------------------- |
| 癫痫预警（Preictal detection） | 用周期趋势子序列建模近期变化           |
| 轻量模型部署（边缘AI）         | 借鉴参数共享 + 局部趋势提取结构        |
| 多通道脑电融合                 | 每通道共享趋势提取器 + 特征聚合分类    |
| 多频段建模                     | 类比多周期建模：每个频段建独立趋势模块 |

---

### 📝 四、小结

* SparseTSF 的贡献不止于预测准确率，更在于**重构了时间序列的建模方式**；
* 对我们 EEG 项目而言，其提出的“周期结构解耦 + 趋势稀疏建模”思路可迁移应用于：

  * **高效特征提取**
  * **低资源部署**
  * **信号趋势性异常检测**
* 后续可以基于该思想尝试构建“趋势引导型EEG分类网络”，推动轻量化与可解释性方向发展。

---

<script src="https://giscus.app/client.js"
        data-repo="Le1zyCatt/le1zycatt.github.io"
        data-repo-id="R_kgDOORaJaw"
        data-category="Announcements"
        data-category-id="DIC_kwDOORaJa84Co8xd"
        data-mapping="pathname"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="bottom"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        crossorigin="anonymous"
        async>
</script>
