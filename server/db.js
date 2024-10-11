const { MongoClient } = require('mongodb');

// Connection URL
const url = 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);
const dbName = 'coin_data';
const coinNames = ['bitcoin', 'ethereum', 'matic-network'];
const collectionNames = ['bitcoin', 'ethereum', 'matic'];

async function insert_data(coin_data) 
{
    try {
        await client.connect();
        const db = client.db(dbName);

        for (let i = 0; i < collectionNames.length; i++) {
            const collection = db.collection(collectionNames[i]);
            const currentRows = await collection.countDocuments();
            const data_to_insert = coin_data[coinNames[i]];

            // Assign a custom `id` for easy retrieval (e.g., row count + 1 or timestamp-based)
            data_to_insert['id'] = currentRows + 1;

            if (currentRows < 100) {
                // Case for rows < 100
                const lastDoc = await collection.findOne({ id: currentRows });
                let current_rolling_sum_last100 = lastDoc ? Number(lastDoc.rolling_sum_last100) : 0;

                data_to_insert['rolling_sum_last100'] = (Number(current_rolling_sum_last100) + Number(data_to_insert['usd'])).toFixed(2);

                const rolling_mean_last100 = (data_to_insert['rolling_sum_last100'] / (currentRows + 1)).toFixed(2);
                data_to_insert['rolling_mean_last100'] = parseFloat(rolling_mean_last100);

                // Compute variance and stddev for current rows
                const allDocs = await collection.find().toArray();
                const values = allDocs.map(doc => doc.usd).concat([data_to_insert['usd']]);
                const mean = data_to_insert['rolling_mean_last100'];
                const variance = (values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (currentRows + 1)).toFixed(2);
                const stddev = Math.sqrt(variance).toFixed(2);

                data_to_insert['rolling_variance_last100'] = parseFloat(variance);
                data_to_insert['rolling_stddev_last100'] = parseFloat(stddev);

                // Insert the document
               const insert_res= await collection.insertOne(data_to_insert);
                console.log(insert_res);
            } 
            if (currentRows >= 100) 
            {
                const oldestDoc = await collection.findOne({ id: currentRows - 99 });
                const oldestValue = oldestDoc['usd'];
                const lastDoc = await collection.findOne({ id: currentRows });

                let current_rolling_sum_last100 = lastDoc.rolling_sum_last100;
                const current_rolling_variance_last100 = lastDoc.rolling_variance_last100;
                const oldMean = lastDoc.rolling_mean_last100;

                // Update rolling sum by subtracting oldest and adding new value
                const new_rolling_sum_last100 = (current_rolling_sum_last100 - oldestValue + data_to_insert['usd']).toFixed(2);
                data_to_insert['rolling_sum_last100'] = parseFloat(new_rolling_sum_last100);

                const newMean = (new_rolling_sum_last100 / 100).toFixed(2);
                data_to_insert['rolling_mean_last100'] = parseFloat(newMean);

                const startIndex = Math.max(1, currentRows - 99);
                const allDocs = await collection.find({id:{$gt:startIndex,$lt:currentRows+1}}).toArray();
                const values = allDocs.map(doc => doc.usd).concat([data_to_insert['usd']]);
                const variance = (values.reduce((acc, val) => acc + Math.pow(val - newMean, 2), 0) / 100).toFixed(2);
                const stddev = Math.sqrt(variance).toFixed(2);

                data_to_insert['rolling_variance_last100'] = parseFloat(variance);
                data_to_insert['rolling_stddev_last100'] = parseFloat(stddev);
                const insert_res=await collection.insertOne(data_to_insert);
                console.log(insert_res);
            }
            
        }
    } catch (err) {
        console.log(err);
    } finally {
        await client.close();
    }
}
async function fetch_data(coin)
{
    try
    {
        await client.connect();
        const db=client.db(dbName);
        let collectionName;
        if(coin==='bitcoin' )
        collectionName='bitcoin';
        else if(coin==='ethereum')
            collectionName='ethereum';
        else
            collectionName='matic';
        const collection=db.collection(collectionName);
        const data = await collection.find().sort({id:-1}).limit(1);
        const res=await data.toArray();
        console.log("sending", collectionName,"info to the user from DB");
        return res;
    }
    catch(err)
    {
        console.log(err);
    }
    finally{
        await client.close();
    }
    

}

// async function testInsertion(client) {
//     for (let i = 1; i <= 105; i++) {
//         // Generate new dummy data for each insertion
//         const coin_data = {
//             bitcoin: {
//                 usd: Math.random() * 50000,
//             },
//             ethereum: {
//                 usd: Math.random() * 3000,
//             },
//             'matic-network': {
//                 usd: Math.random() * 2,
//             }
//         };
//         await insert_data(client, coin_data);
//         console.log(`Inserted row ${i}`);
//     }
// }

// function calculateMean(values) {
//     const sum = values.reduce((acc, val) => acc + val, 0);
//     return sum*1.0 / values.length;
// }

// // Function to calculate variance
// function calculateVariance(values, mean) {
//     const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
//     return variance;
// }

// async function test_results(collectionName, index) 
// {
//     try {
//         await client.connect();
//         const db = client.db('coin_data');
//         const collection = db.collection(collectionName);
        
//         // Get all documents
//         const allDocs = await collection.find().toArray();
        
//         // Determine the range of documents to consider
//         const startIndex = Math.max(0, index - 100); // Get the last 100 or fewer docs
//         const selectedDocs = allDocs.slice(startIndex, index);
//         // Extract the 'usd' values
//         const usdValues = selectedDocs.map(doc => doc.usd);
        
//         // Calculate mean, variance, and standard deviation
//         const mean = calculateMean(usdValues);
//         const variance = calculateVariance(usdValues, mean);
//         const stddev = Math.sqrt(variance);

//         console.log(`Results for collection "${collectionName}" at index ${index}:`);
//         console.log(`Mean: ${mean.toFixed(2)}`);
//         console.log(`Variance: ${variance.toFixed(2)}`);
//         console.log(`Standard Deviation: ${stddev.toFixed(2)}`);
        
//     } catch (error) {
//         console.error('Error calculating results:', error);
//     } finally {
//         await client.close();
//     }
// }

// // testInsertion(client);
// // test_results("bitcoin",105);

module.exports={insert_data,fetch_data}

