import axios from 'axios';

const testApiReorder = async () => {
    try {
        console.log('Testing Reorder API...');
        // First get IDs
        const res = await axios.get('http://localhost:5000/api/facilities');
        const ids = res.data.map((f: any) => f.id);

        if (ids.length < 2) {
            console.log('Not enough items to reorder');
            return;
        }

        const reversedIds = [...ids].reverse();
        console.log('Sending IDs:', reversedIds);

        const updateRes = await axios.put('http://localhost:5000/api/facilities/reorder', {
            orderedIds: reversedIds
        });

        console.log('Response:', updateRes.data);

    } catch (error: any) {
        console.error('API Error:', error.response ? error.response.data : error.message);
    }
};

testApiReorder();
