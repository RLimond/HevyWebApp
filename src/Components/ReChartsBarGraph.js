import {  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
export default function ReChartsBarGraph({graphData, xKey, yKey, color}){
    return(
        <ResponsiveContainer width='100%' height={250}>
        <BarChart
        width={500}
        height={300}
        data={graphData}
        margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
        }}
        >
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={yKey} fill={color ? color : "#82ca9d"} />
        </BarChart>
    </ResponsiveContainer>
    )
}