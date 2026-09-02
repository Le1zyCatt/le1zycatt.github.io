---
title: "Mooncake 技术工作总结：从兼容层到原生数据面"
date: 2026-09-02 10:00:00 +0800
categories: [开源, 分布式系统]
tags: [Mooncake, TENT, RDMA, UB, 存储系统]
author: lc
description: >-
  复盘 Mooncake 在传输架构、连接预热、可靠删除、缓存一致性、RDMA 数据路径与 SSD 调度上的关键演进。
toc: true
---

Mooncake 这一阶段的工作看起来分散在 transport、Store、cache 和 allocation，背后却是同一条主线：**缩短数据路径，封闭并发窗口，把不可控状态改造成可重试、可验证的协议。**

## 这次复盘覆盖什么

- **UB → TENT**：从复用 Classic Transfer Engine 的兼容层，演进为 TENT-native 的任务与切片模型。
- **Warmup**：将远端 metadata、handshake 和 endpoint 创建前移到初始化阶段，降低业务首访的尾延迟。
- **Bucket 删除与 GC**：用 Holder-specific task、持久化 tombstone、ACK 与后台 GC 组成可靠回收链路。
- **HotCache**：通过两阶段失效，封闭异步 Fill 与 Remove / Upsert 之间的 stale race。
- **RDMA 少一跳**：从 Requester Pull 改为 Target Push，减少一次同步等待与中间交互。
- **SSD 负载均衡**：让分配与删除共同维护容量反馈，形成可信的调度闭环。

> 下方是完整的交互式技术复盘，包含总体架构、核心类图、时序图、Before / After 数据路径以及社区协作流程。建议桌面端阅读；也可以[打开全屏版本](/assets/mooncake/technical-review.html)。
{: .prompt-info }

<iframe
  src="/assets/mooncake/technical-review.html"
  title="Mooncake 技术工作总结交互式报告"
  width="100%"
  height="960"
  loading="lazy"
  style="display:block;border:1px solid #2b4664;border-radius:14px;background:#070d14;box-shadow:0 18px 44px rgba(0,0,0,.24);"
></iframe>

## 一句话总结

这组优化并不是六个孤立的功能点：TENT-native 化在统一抽象边界，Warmup 在前移冷启动成本，可靠删除与 HotCache 修复在收敛并发状态，RDMA Push 在缩短关键路径，SSD 调度则在闭合资源反馈。它们共同把 Mooncake 从“能工作”推向“更可扩展、更可靠，也更容易被社区验证和维护”。
