import axios from 'axios';
import { createAxios } from './axios'


//其他配置
const request = createAxios({
    baseURL: 'http://20.1.170.90:2233/chat',
});


export const ChatStop = (data: any): any => {
    return request.post("/api/chat/stop", data)
}



