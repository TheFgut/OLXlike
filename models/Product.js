const { Decimal128 } = require('mongodb')
const { Schema, model } = require('mongoose')

const schema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: {
        data: Buffer, // Binary image data
        contentType: String // MIME type of the image (e.g., "image/jpeg")
    },
    shortDescription: {
        type: String

    },
    description: {
        type: String

    },
    price: {
        type: Number,
        default: 0
    },
    sellerDetails: {
        name: String,
        contactDetails: String
    }
})

module.exports = model('product', schema)
