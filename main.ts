import { PuppetPadlocal } from "wechaty-puppet-padlocal";
import { Contact, log, Message, ScanStatus, Wechaty, Room, RoomInvitation, MiniProgram } from "wechaty";
import { exit } from "process";

// 去掉注释，可以完全打开调试日志
// log.level("silly");
const robot_nickname: string = "泽隆"; //使用机器人微信昵称
const robot_username: string = "gh_02c38afb3893@app";//使用机器人微信用户 分享小程序获得
const url_prefix = 'https://www.ebaina.com/';
var request = require('request');
const puppet = new PuppetPadlocal({
    token: "puppet_padlocal_4da8e93c5baa402b8eeaa5d296f5673d"
})

function onScan(qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting && qrcode) {
        const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
        ].join('')

        log.info("TestBot", `onScan: ${ScanStatus[status]}(${status}) - ${qrcodeImageUrl}`);

        require('qrcode-terminal').generate(qrcode, { small: true })  // show qrcode on console
    } else {
        log.info("TestBot", `onScan: ${ScanStatus[status]}(${status})`);
    }
}
function onLogin(user: Contact) {
    log.info("TestBot", `${user} login`);
}
function onLogout(user: Contact, reason: string) {
    log.info("TestBot", `${user} logout, reason: ${reason}`);
}
//收到了消息
async function onMessage(message: Message) {
    const text = message.text()
    const contact = message.talker()
    if (message.to()?.self() && message.text().indexOf("更新群") !== -1) {
        const allRooms = await bot.Room.findAll();
        let room_ary = [];
        for (let room of allRooms) {
            var room_name = await room.topic() //群名
            var room_owner_name = room.owner().name() //群主名称
            var memberList = await room.memberAll()//群成员
            var member_count: number = 0; //群成员个数
            var member;
            for (member in memberList) {
                member_count++;
            }
            var one_room = [
                room.id, room_name, room_owner_name, member_count
            ];
            room_ary.push(one_room)
        }
        var url = url_prefix + 'wechaty/init_wechaty_room'; //请求后端 存入机器人群初始化   
        request({
            url: url,
            method: 'post',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(room_ary)
        }, function (error: any, response: any, body: any) {
            console.log(response)
        });
    }
}

// 有人进入了群聊
async function onRoomJoin(room: Room, inviteeList: Contact[], inviter: Contact, date) {
    //说明是机器人自己被邀请进入了某个群
    if (inviteeList[0].name() == robot_nickname) {
        const room_name = await room.topic() //群名
        const room_owner_name = room.owner().name() //群主名称
        const memberList = await room.memberAll()//群成员
        var member_count: number = 0; //群成员个数
        var member;
        for (member in memberList) {
            member_count++;
        }

        var url = url_prefix + 'wechaty/send_room_info'; //请求后端 存入机器人加入群数据
        var sites = {
            'inviter_id': inviter.id,
            'inviter_name': inviter.name(),
            'room_id': room.id,
            'room_name': room_name,
            'room_owner_name': room_owner_name,
            'member_count': member_count
        };
        request({
            url: url,
            method: 'post',
            json: true,
            headers: {
                'content-type': 'application/json',
            },
            body: JSON.stringify(sites)
        }, function (error: any, response: any, body: any) {
            console.log(response)
        });
    }
}

// 通过群邀请
async function onRoomInvitation(roomInvite: RoomInvitation) {
    await roomInvite.accept();
}

// 获得聊天室推送数据任务
function getPushDataToRoom() {
    var url = url_prefix + 'wechaty/get_push_data_to_room'; //获得推送数据
    request(url, function (error: any, response: any, body: any) {
        if (!error && response.statusCode == 200) {
            var body_json = JSON.parse(body)
            if (body_json.data && body_json.code == 200) {
                PushDataToRoom(body_json.data)
            }
        }
    });
}

// 按照任务 把数据推送到每个聊天室
async function PushDataToRoom(data: any) {
    var i;
    for (i in data) {
        var url = url_prefix + 'wechaty/change_task_log_status/' + data[i]['id']; //推送后 通知地址改变任务状态为已推送
        const room = await bot.Room.find({ id: data[i]['wechaty_room_id'] })
        if (room) {
            switch (data[i]['type']) {
                case '方案':
                    var miniProgramPayload_project = {
                        appid: 'wxea07fa6c78b07a55',
                        description: '云方案',
                        iconUrl: data[i]['content']['thumbs'][0],
                        pagePath: 'pages/details/project_show/project_show.html?content_id=' + data[i]['content']['id'] + '&supplier_id=' + data[i]['content']['supplier_id'] + '&_um_ssrc=oLiO65VCNZh-WZSUSwP4U39zW4lo&_um_sts=1631153227162',
                        thumbUrl: data[i]['content']['thumbs'][0],
                        title: data[i]['content']['title'],
                        username: robot_username
                    };
                    var miniProgram = new MiniProgram(miniProgramPayload_project);
                    break;
                case '需求':
                    var miniProgramPayload_demand = {
                        appid: 'wxea07fa6c78b07a55',
                        description: '云方案',
                        iconUrl: 'https://ebaina.oss-cn-hangzhou.aliyuncs.com/direct/resource/202103/18/Lark20210319-095747.png',
                        pagePath: 'pages/details/needs_pro_show/needs_pro_show.html?show_id=' + data[i]['content']['id'],
                        thumbUrl: 'https://ebaina.oss-cn-hangzhou.aliyuncs.com/direct/resource/202103/18/Lark20210319-095747.png',
                        title: data[i]['content']['title'],
                        username: robot_username
                    };
                    var miniProgram = new MiniProgram(miniProgramPayload_demand);
                    break;
                case '企业':
                    var miniProgramPayload_supplier = {
                        appid: 'wxea07fa6c78b07a55',
                        description: '云方案',
                        iconUrl: data[i]['content']['tags']['thumb'],
                        pagePath: 'pages/details/details.html?supplier_id=' + data[i]['content']['id'],
                        thumbUrl: data[i]['content']['tags']['thumb'],
                        title: data[i]['content']['company_name'],
                        username: robot_username
                    };
                    var miniProgram = new MiniProgram(miniProgramPayload_supplier);
                    break;
            }
            await sendMessage(data[i]['wechaty_room_id'], data[i]['task']['instruction']);
            await sendMessage(data[i]['wechaty_room_id'], miniProgram);
            request(url, function (error: any, response: any, body: any) {
                console.log(response)
            });
        }
    }
}
//群聊名称被修改
async function onRoomTopic(room: Room, newTopic: string, oldTopic: string, changer: Contact, date?: Date) {
    var url = url_prefix + 'wechaty/change_room_topic'; //请求后端 存入机器人加入群数据
    var sites = {
        'room_id': room.id,
        'new_topic': newTopic,
    };
    request({
        url: url,
        method: 'post',
        json: true,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(sites)
    }, function (error: any, response: any, body: any) {
        console.log(response)
    });
}


async function pushRoomListToBackgroud() {
    const allRooms = await bot.Room.findAll();
    let room_id_ary: string[] = [];
    for (let room of allRooms) {
        room_id_ary.push(room.id);
    }
    var url = url_prefix + 'wechaty/check_wechaty_room'; //请求后端 检测机器人目前的所有群聊
    var sites = {
        'room_id_ary': room_id_ary,
    };
    request({
        url: url,
        method: 'post',
        json: true,
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify(sites)
    }, function (error: any, response: any, body: any) {
        console.log(response)
    });
}
/**
 * toUserId: wxid_xxx | xxx@chatroom
 * payload: string | number | Message | Contact | FileBox | MiniProgram | UrlLink
 */
const sendMessage = async (toUserId: string, payload: any): Promise<Message> => {
    const toContact = await bot.Contact.load(toUserId);
    const message = (await toContact.say(payload)) as Message;
    return message;
};
const bot = new Wechaty({
    name: "TestBot1",
    puppet,
})

bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
// bot.on('message', onMessage)
// bot.on('room-join', onRoomJoin)
// bot.on('room-invite', onRoomInvitation)
// bot.on('room-topic', onRoomTopic)
bot.start().then(() => {
    log.info("TestBot", "started.");
});

//定时器 请求后端接口 获取推送接口数据
setInterval(() => {
    getPushDataToRoom();
}, 1200000)


//定时器 请求后端接口 把机器当前的所有群发送给后端
// setInterval(() => {
//     pushRoomListToBackgroud();
// }, 3600000)
