---
title: vllm+qlora本地部署微调1.5B大模型
date: 2025-07-09 15:00:00 +0800
categories: [大模型]
tags: [vllm， qlora]     # TAG names should always be lowercase
author: lc
description: >-
    记述了在wsl2中使用vllm部署1.5B的Qwen架构模型，并使用qlora方法进行微调的过程。
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
# 1.目标与流程
## 1️⃣目标
-- 在本地跑起来一个大模型  
-- 希望使用全量大模型而不是量化过的（ollama就是，所以可以跑7B）  
-- 熟悉vllm部署流程与操作（实践中常用此框架）
# 2.环境部署
## 1️⃣配置要求
内存：32GB  
显卡：4060ti 8GB  
开启wsl2，使用ubuntu发行版运行。  
## 2️⃣安装环境
1. 使用vscode连接ubuntu之后，进入到工作目录。  
2. 建议创建conda环境：
```cmd
conda create -n vllm python=3.10
conda activate vllm
pip install -r requirements.txt
```
```requirements.txt

```
3. 从huggingface下载模型：
```cmd
git clone *****
```
# 3.运行模型
运行如下命令。注意调整参数以适应电脑配置。（这里不知道为什么怎么调gpu都是占用率拉满...）
```cmd
python -m vllm.entrypoints.openai.api_server \  #运行vllm服务
  --model ~/deepseek1.5B/DeepSeek-R1-Distill-Qwen-1.5B \  #指定模型路径，该路径下需要有模型权重文件
  --port 8000 \
  --gpu-memory-utilization 0.7 \  #最高gpu利用率，设低了就跑不了
  --max-token-len=8192  #最大推理token长度，设高了也跑不了
```


# 4.微调与应用
1.使用vllm本地部署DeepSeek-R1-Distill-Qwen-1.5B，这是一个
distill蒸馏模型，基于Qwen架构（一种类transformer架构）

2.在wsl2环境中进行部署。首先从huggingface使用git clone下载模型文件，然后复制进ubuntu，
接下来创建新的conda环境vllm，pip install vllm，版本号见requirements.txt

3.
qlora流程：
1. 准备数据（指令+输出格式，JSON or JSONL）
2. 加载 base 模型（DeepSeek-R1）
3. 应用 LoRA 配置（PEFT + bitsandbytes）
4. 使用 Trainer 或 SFT Trainer 微调模型
5. 保存 adapter 权重（adapter_model）
6. 使用 vLLM 加载 base 模型 + adapter

这里的lora和qlora有啥区别？是不是计算量的区别？

4.部署qlora微调需要：
--新开一个环境
--准备好json格式的数据（带标签）
--

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
