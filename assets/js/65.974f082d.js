(window.webpackJsonp=window.webpackJsonp||[]).push([[65],{473:function(_,r,v){"use strict";v.r(r);var t=v(14),a=Object(t.a)({},(function(){var _=this,r=_._self._c;return r("ContentSlotsDistributor",{attrs:{"slot-key":_.$parent.slotKey}},[r("p",[_._v("如今市面上 MQTT Broker 产品的选择非常多，每款产品都会强调自身在各方面的优势。")]),_._v(" "),r("p",[_._v("各式各样的宣传点容易给用户在产品选择上造成一定的困扰。本文将结合自身的实践经验，谈谈 MQTT Broker 的选择思路。")]),_._v(" "),r("h2",{attrs:{id:"一、排除干扰项"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#一、排除干扰项"}},[_._v("#")]),_._v(" 一、排除干扰项")]),_._v(" "),r("p",[_._v("为了突出卖点，很多产品都在不断地堆砌功能。无论这些功能的实用性如何，反正功能数量就是一种产品优势的体现。")]),_._v(" "),r("p",[_._v("而这些不实用的干扰项，极容易影响用户的判断。此处列举几个例子，局中读者可细品，并作出理性的判断。")]),_._v(" "),r("h3",{attrs:{id:"_1-1-规则引擎"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_1-1-规则引擎"}},[_._v("#")]),_._v(" 1.1 规则引擎")]),_._v(" "),r("p",[_._v("MQTT Broker 中的规则引擎主要用于对客户端上报的数据进行基础的过滤、结构化转换和路由分发。\n虽然规则引擎是物联网平台的必要功能，但它不应成为 Broker 的特性。")]),_._v(" "),r("p",[_._v("MQTT Broker 应作为物联网平台的核心部件，而不是替代平台的功能。\n在 Broker 中配置规则引擎，意味着它已经在承载一定的业务逻辑。\n此时的 MQTT Broker 便不再是纯粹的消息中间件，而是与后台业务系统同一性质的存在，需要企业持续投入与业务系统同等的研发资源，直接带来了成本的增加。")]),_._v(" "),r("p",[_._v("从事软件研发的朋友应该都清楚，所有的线上故障都来自人为因素。\n在 Broker 中维护规则引擎是一件高风险的行为，它不像业务系统还能做一定的业务隔离、流量管控。\n错误的规则一旦生效，可能直接影响全网消息的分发。\nMQTT Broker 难以实现精细化的数据治理，这份职责应当由后端的物联网平台来承担更为合适。")]),_._v(" "),r("p",[_._v("尤其当面临服务扩缩容、业务迁移的时候，Broker 中的规则逻辑可能直接影响方案的顺利落地。")]),_._v(" "),r("p",[_._v("当然，并不是说规则引擎在 MQTT Broker 中毫无价值，只是非常有限，个人建议属于业务域的逻辑就统一在业务系统中集中管理，慎用 Broker 自带的规则引擎。")]),_._v(" "),r("h3",{attrs:{id:"_1-2-数据桥接功能"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_1-2-数据桥接功能"}},[_._v("#")]),_._v(" 1.2 数据桥接功能")]),_._v(" "),r("p",[_._v("数据桥接是 MQTT Broker 将接收到的消息直接写入三方中间件的能力，常见的如：Kafka、Redis、MySQL等。\n这类功能的根本目的就是为了"),r("strong",[_._v("数据持久化")]),_._v("，以及对后台业务提供"),r("strong",[_._v("削峰填谷")]),_._v("的作用。")]),_._v(" "),r("p",[r("strong",[_._v("但通过 Broker 桥接至三方中间件，会存在较大的稳定性问题和安全隐患")]),_._v("。")]),_._v(" "),r("p",[_._v("首先，三方中间件通常不是专门服务于 MQTT Broker 的，同时还支持着其他业务。\n倘若中间件出现抖动，将直接影响 Broker 的吞吐量，更有甚者还会导致全网 MQTT Client 出现 IO 超时现象。")]),_._v(" "),r("p",[_._v("其次，MQTT Broker 通常是暴露在公网上的服务。\n一旦出现账号密码泄露，黑客发起的流量攻击，通过数据桥接功能会直接拖垮中间件，并产生一系列不可预知的连锁反应。")]),_._v(" "),r("p",[_._v("所以，如果是为了数据持久化和削峰填谷的目的，建议在 Broker 与中间件之间有一道专门对数据进行预处理的服务，前文提到的规则引擎能力也适合落在该服务上。")]),_._v(" "),r("h3",{attrs:{id:"_1-3-集群"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_1-3-集群"}},[_._v("#")]),_._v(" 1.3 集群")]),_._v(" "),r("p",[_._v("集群算是一项非常有吸引力的特性，这项能力可能直接影响用户的选择。")]),_._v(" "),r("p",[_._v("笔者认为，MQTT Broker的集群功能只是有一定的技术价值，仅此而已，它几乎没什么实用性。")]),_._v(" "),r("p",[_._v("集群在横向扩容方面几乎是无限的。但与此同时，由于所有节点的数据都需要分发到集群中的其他 Broker 节点，流量在内部是会被放大的。\n并且随着集群规模的增大，流量也成等比放大，进一步加剧了服务的负载。")]),_._v(" "),r("p",[_._v("什么样的用户会关心集群功能？一定是有着一定设备体量的企业！而单台服务器便可支撑 10 万以上的连接数，试问有多少企业的设备规模达到这种体量。\n对于大多数企业，完全没必要去关心一项自身用不上的功能。")]),_._v(" "),r("p",[_._v("即便某家企业的设备规模确实达到数十万，乃至上百万。\n结合物联网的行业属性，较少存在终端设备与终端设备直接互联互通的情况，更多都是终端与平台的交互。在这种前提下，负载均衡的架构便可满足需求，同时也具备横向扩缩容能力。")]),_._v(" "),r("p",[_._v("并且出于服务稳定性考虑，分区分域的业务隔离也是一种合适的方案，完全没有必要通过集群来彰显平台的接入能力。")]),_._v(" "),r("p",[_._v("所以，对于 MQTT Broker 宣传的集群能力，各位读者看看就罢了。")]),_._v(" "),r("div",{staticClass:"custom-block tip"},[r("p",{staticClass:"custom-block-title"},[_._v("提示")]),_._v(" "),r("p",[_._v("没有最好的产品，只有最适合的产品。以终为始，基于自身的需求作出理性判断，切莫被这些干扰项误了眼。")])]),_._v(" "),r("h2",{attrs:{id:"二、免费开源-vs-商业付费"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#二、免费开源-vs-商业付费"}},[_._v("#")]),_._v(" 二、免费开源 vs 商业付费")]),_._v(" "),r("p",[_._v("免费开源产品和商业付费产品各有优劣，用户需结合自身情况作出合适的选择。")]),_._v(" "),r("h3",{attrs:{id:"_2-1-商业付费"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_2-1-商业付费"}},[_._v("#")]),_._v(" 2.1 商业付费")]),_._v(" "),r("p",[_._v("商业付费产品通常提供稳定的服务和技术支持，适合有一定收入的企业。虽然需要支付一定的资金成本，但厂商有动力提供高质量的服务，属于互惠互利的关系。")]),_._v(" "),r("h3",{attrs:{id:"_2-2-免费开源"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_2-2-免费开源"}},[_._v("#")]),_._v(" 2.2 免费开源")]),_._v(" "),r("p",[_._v("免费开源产品成熟度通常不及商业产品，且售后服务不一定有保障。但对于大多数中小场景的用户，开源产品也能满足需求。产品开发者没有义务无偿提供技术支持，因此遇到问题时，用户需自行解决或付费咨询。")]),_._v(" "),r("p",[_._v("目前市面上的几款开源 MQTT Broker 已能满足大多数用户的需求。如果预算有限且业务体量不大，可以选择免费开源产品。")]),_._v(" "),r("h2",{attrs:{id:"三、该如何选择-broker"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#三、该如何选择-broker"}},[_._v("#")]),_._v(" 三、该如何选择 Broker")]),_._v(" "),r("p",[_._v("选择 MQTT Broker 时，应重点关注以下几点：")]),_._v(" "),r("ul",[r("li",[_._v("设备连接量")]),_._v(" "),r("li",[_._v("并发吞吐量")]),_._v(" "),r("li",[_._v("安全认证")])]),_._v(" "),r("h3",{attrs:{id:"_3-1-设备连接量较小"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_3-1-设备连接量较小"}},[_._v("#")]),_._v(" 3.1 设备连接量较小")]),_._v(" "),r("p",[_._v("对于设备连接量在几千到几万的用户，市面上已有的 Broker 产品几乎都可以满足需求。")]),_._v(" "),r("p",[_._v("前期不必过于纠结哪款产品最好，也不必在意是否支持集群或百万连接。这个阶段的业务体量还不需要高级服务。")]),_._v(" "),r("h3",{attrs:{id:"_3-2-设备连接量较多"}},[r("a",{staticClass:"header-anchor",attrs:{href:"#_3-2-设备连接量较多"}},[_._v("#")]),_._v(" 3.2 设备连接量较多")]),_._v(" "),r("p",[_._v("对于连接量达到十万甚至百万级的用户，才是真正难以抉择的阶段。\n一方面支持这种体量的免费 Broker 极少；另一方面未经实测并无法断定产品的真实能力。")]),_._v(" "),r("p",[_._v("许多产品声称支持百万级连接，但很少明确说明是单机百万还是集群百万。\n如果能做到单机百万，需关注对机器配置的要求。如果硬件成本过高，选择集群架构可能更经济。")]),_._v(" "),r("p",[_._v("最后一点，无论产品宣传的多么好，大家都要以实测的结果为准。是骡子是马，都还得亲自遛一遛。")])])}),[],!1,null,null,null);r.default=a.exports}}]);