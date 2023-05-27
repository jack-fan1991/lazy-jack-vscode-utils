import axios from 'axios';

export async function getWebData(uri: string):Promise<any> {
    try {
        const response = await axios.get(uri);
        console.log(response.data);
        return response.data
    } catch (error) {
        console.error(error);
    }
}

