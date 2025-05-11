---
title: docker+opengauss数据库系统大作业
date: 2025-04-16 17:03:00 +0800
categories: [docker, database system, 大作业]
tags: [opengauss, VM]     # TAG names should always be lowercase
author: lc
description: >-
    本文记录了有关数据库系统大作业opengauss的基础操作和简单流程。
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
docker有2个重要概念：**镜像**与**容器**。
**镜像**是用于*拉取*的对象，可以从配置好的*镜像源* *拉取*，相当于python中的库。  
这次的大作业要求使用opengauss，正好我又有docker环境，因此选择docker部署。参考的是[opengauss官方文档](https://docs.opengauss.org/zh/docs/7.0.0-RC1/docs/InstallationGuide/%E5%AE%B9%E5%99%A8%E9%95%9C%E5%83%8F%E5%AE%89%E8%A3%85.html)。  
## 镜像拉取与容器创建  

```docker
$ docker pull opengauss/opengauss-server:latest
```
首先拉取docker镜像。直接运行run命令会根据指定的镜像创建一个新容器，如果本地没有此镜像则默认会去官方仓库拉取。  
  
```docker
{
  "builder": {
    "gc": {
      "defaultKeepStorage": "20GB",
      "enabled": true
    }
  },
  "experimental": false,
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://noohub.ru",
    "https://huecker.io",
    "https://dockerhub.timeweb.cloud",
    "https://0c105db5188026850f80c001def654a0.mirror.swr.myhuaweicloud.com",
    "https://5tqw56kt.mirror.aliyuncs.com",
    "https://docker.1panel.live",
    "http://mirrors.ustc.edu.cn/",
    "http://mirror.azure.cn/",
    "https://hub.rat.dev/",
    "https://docker.ckyl.me/",
    "https://docker.chenby.cn",
    "https://docker.hpcloud.cloud",
    "https://docker.m.daocloud.io"
  ]
}
```
也可以在设置里配置镜像源，上面是我的docker engine配置(忘了从哪里薅过来的了)。  

```docker
docker images
```
查看本地的镜像状态。  
  
```docker
$ docker run --name opengauss --privileged=true\
 -d -e GS_PASSWORD=YourPassoword\
 -p 8888:5432\
 opengauss/opengauss-server:latest
```
--name：命名  
--privileged：授予容器特权模式  
-d：后台模式运行容器
-p：端口设置，将**容器**的5432端口映射到**宿主机**的8888端口。  
-e：设置数据库超级用户omm密码（需要8位以上+数字+大小写+特殊符号，不然会无法运行）  
在*本容器内*连接数据库无需密码，在其他容器则需要。  
其他参数设置：
>-e GS_NODENAME=YourNodeName：指定数据库节点名称，默认为gaussdb  
>-e GS_USERNAME=YourUserName：指定数据库连接用户名，默认为测试用户gaussdb  
>-e GS_USER_PASSWORD=YourUserPassword：指定用户$GS_USERNAME密码，默认为$GS_PASSWORD  
>-e GS_PORT=YourPort：指定容器内数据库端口，默认为5432  
>-e GS_DB=YourDbName：在容器内创建数据库，默认为postgres  

## 容器的使用与gsql客户端
```docker
docker ps
```
验证容器运行状态。可以看到容器的一系列数据。  
此时容器就已经创建好了，并且应该是在运行中。接下来是**每次开机后运行容器的步骤**。  
```docker
docker start opengauss
exec -it opengauss bash //在bash窗口中打开opengauss容器。
```
此时就打开了**bash界面**。
```bash
su omm //获取超级用户权限。
gsql -d postgres -p 5432 //使用gsql工具进入postgres（默认创建）数据库，容器端口是5432。
\i pwd
\i cd xx //在进入了数据库后可使用gsql客户端的元命令，此处意为执行外部命令。可以用于查看路径和进入路径等。  
```
此时已经进入了opengauss的操作界面。
```docker
docker cp 宿主机路径 容器名:容器内路径
```
用于将文件复制到容器内。这里不知道出了什么问题，宿主机文件**只能来自于c盘**。。。  


>“在 openGauss（以及 PostgreSQL）中，\q、\i 等是以反斜杠（\）开头的 元命令（meta-commands），用于在 gsql 命令行客户端中执行一些特殊操作。这些命令不是 SQL 语句，而是 gsql 提供的快捷功能。”
  
以下记载一些常用的元命令，由*deepseek*生成。放在这里以供随时查阅。   

## 元命令：基本概念
- 以反斜杠 `\` 开头的命令是 `gsql` 客户端特有的元命令(meta-commands)
- 不是SQL语句，仅在 `gsql` 命令行中有效
- 提供数据库管理的快捷操作

## 常用元命令

### 连接控制

| 命令            | 说明                     | 示例               |
|-----------------|--------------------------|--------------------|
| `\q`           | 退出 gsql 客户端         | `\q`              |
| `\c [DBNAME]`  | 连接/切换数据库          | `\c mydb`         |
| `\conninfo`    | 显示当前连接信息         | `\conninfo`       |

### 脚本与输出

| 命令          | 说明                        | 示例                          |
|--------------|-----------------------------|-------------------------------|
| `\i FILE`    | 执行SQL脚本文件             | `\i /path/to/script.sql`      |
| `\o [FILE]`  | 将输出重定向到文件          | `\o /tmp/result.txt`          |
| `\e`         | 用编辑器编辑查询            | `\e`                         |

### 信息查询

| 命令       | 说明                           | 示例                |
|------------|--------------------------------|---------------------|
| `\d`       | 列出所有对象(表/视图/序列等)   | `\d`               |
| `\dt`      | 只列出表                       | `\dt`              |
| `\dv`      | 只列出视图                     | `\dv`              |
| `\ds`      | 只列出序列                     | `\ds`              |
| `\di`      | 列出索引                       | `\di`              |
| `\dn`      | 列出所有schema                 | `\dn`              |
| `\du`/`\dg`| 列出用户/角色                  | `\du`              |
| `\l`       | 列出所有数据库                 | `\l`               |

### 显示控制

| 命令         | 说明                            | 示例               |
|--------------|---------------------------------|--------------------|
| `\x`         | 切换扩展显示模式(行/列)         | `\x`              |
| `\timing`    | 开启/关闭执行时间统计           | `\timing`         |
| `\pset`      | 设置输出格式                    | `\pset border 2`  |

### 帮助命令

| 命令         | 说明                  | 示例               |
|--------------|-----------------------|--------------------|
| `\?`         | 显示所有元命令帮助    | `\?`              |
| `\h [CMD]`   | SQL命令语法帮助       | `\h CREATE TABLE` |

## 高级用法

```sql
-- 使用通配符查询特定表
\d mytable*

-- 查看函数定义
\df+ myfunction

-- 查看表结构详情
\d+ mytable

-- 执行脚本并记录输出
\o /tmp/result.log
\i init.sql
\o
```
后面我还做了一个**数据目录挂载**，据说可以实现容器内外文件互通，但并没有起作用。所以就先这样吧。  

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
