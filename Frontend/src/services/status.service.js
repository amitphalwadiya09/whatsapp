import axiosInstance from "./url.service";


export const deleteStatus = async ({ statusId }) => {

    try {

        const response = await axiosInstance.delete(
            `/api/status/${statusId}`
        );

        return response.data;

    } catch (error) {

        throw error.response ? error.response.data : error.message;

    }
};

export const StatusViewed = async (statusId) => {

    try {

        const response = await axiosInstance.put(
            `/api/status/${statusId}/view`,
        );

        return response.data;

    } catch (error) {

        throw error.response ? error.response.data : error.message;

    }
};


export const addStatusReaction = async ({ statusId, emoji, message, like }) => {
    try {

        const response = await axiosInstance.post(
            `/api/status/${statusId}/reaction`,
            { emoji, message, like }
        );

        return response.data;

    } catch (error) {

        throw error.response ? error.response.data : error.message;

    }
}
