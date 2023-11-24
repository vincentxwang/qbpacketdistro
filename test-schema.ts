import mongoose from 'mongoose'

const schema = new mongoose.Schema({
    packet: {
        type: String,
        required: true
    },

    packetlink: {
        type: String,
        required: true
    },

    difficulty: {
        type: Number,
        required: true
    },

    usersheard: {
        type: Array,
    },
})

export default mongoose.model('packet', schema)