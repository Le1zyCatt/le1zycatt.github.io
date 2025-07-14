---
title: 《python数据分析与挖掘实战》笔记
date: 2025-07-14 19:00:00 +0800
categories: [数学建模]
tags: [python， 数据分析]     # TAG names should always be lowercase
author: lc
description: >-
    数据分析。
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
# 1.数据质量分析
目标：检查脏数据  
脏数据包括如下内容：  
1. 缺失值
2. 重复值
3. 不一致的值
4. 重复数据及含有特殊符号的数据
5. 异常值
  
## 1️⃣缺失值处理
删除/插值补值/不处理  
## 2️⃣异常值处理
### 一、统计量描述性分析
最大值/最小值/中位数/众数/平均数  
### 二、3sigma原则
对于服从正态分布的数据，数据点在3倍标准差之外的概率小于0.003。  
### 三、箱型图
![箱型图](../assets/img/箱型图.jpeg)  
比较直观，可以看到离群点，据此剔除不合理的值。  
```python
import pandas as pd
data = pd.read_excel(data_path, index_col = u'日期') #指定日期列为索引列
data.describe() #显示分析结果，有非空值数、平均数、标准差、最大最小值、四分位数等，很方便
```
在describe()之后，可以绘制箱型图：  
![箱型图代码](../assets/img/箱型图代码.jpeg)  
![箱型图示例](../assets/img/箱型图示例.jpeg)  
这里的9106.44和6607.4就是需要剔除的异常值。  
# 2.数据特征分析
## 1️⃣分布分析
### 一、定量数据的分布分析
求极差➡️决定组距和分组➡️绘制频率分布直方图
### 二、定性数据的分布分析
一般绘制饼状图/直方图
## 2️⃣对比分析
是将两个相互联系的指标进行比较的分析。此处简略。
## 3️⃣统计量分析
主要分为**集中趋势**和**离中趋势**。前者包括平均数、中位数、众数，后者包括极差、标准差、变异系数（标准差除以均值）、四分位数间距等。
## 4️⃣周期性分析
绘制出以时间为横轴的图像，观察周期性。周末和周中的区别之类的。LSTM、RNN等模型比较适合。
## 5️⃣贡献度分析
这个比较新奇，就是绘制帕累托图。帕累托图(基于20/80定律)就是累积图像，例如：  
![帕累托图](../assets/img/帕累托图.jpeg)  
定律认为，20%的产品创造了80%的利润，也就是说当需要做抉择的时候，优先关注创造了80%利润或者前20%的产品。代码略过，可以使用.cumsum()函数绘制。  
## 6️⃣相关性分析（重点）
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
