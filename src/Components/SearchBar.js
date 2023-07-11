import React, {useState} from "react";
import '../CSS/searchBar.css'

function filterDataByWeeks(data, numberOfWeeks) {
    const currentDate = new Date();
    const filteredData = [];
  
    for (let i = data.length - 1; i >= 0; i--) {
      const dataItem = data[i];
      const itemDate = new Date(dataItem.weekEndDate);
      const diffInWeeks = Math.ceil((currentDate - itemDate) / (7 * 24 * 60 * 60 * 1000));
  
      if (diffInWeeks <= numberOfWeeks) {
        filteredData.unshift(dataItem);
      } else {
        break;
      }
    }
  
    return filteredData;
  }
export default function SearchBar({handleSearch , setData, search, setSearch, timeFrame, setDataStore}){
    const [selectedSearch, setSelectedSearch] = useState('')
    async function handleSubmit(e){
        e.preventDefault()
        if (selectedSearch){
            const results = await handleSearch(selectedSearch)
            if (results.length !== 0){
                setSearch(selectedSearch)
                setSelectedSearch('')
                setDataStore(results)
                setData(filterDataByWeeks(results,timeFrame*4))
                return
            }
            setSearch("Not Found")
            setSelectedSearch('')
        }
    }
    return (
        <>
            <form className="searchBar-form" onSubmit={handleSubmit}>
                <input
                    className="searchBar-input"
                    type="text"
                    value={selectedSearch}
                    onChange={(e) => setSelectedSearch(e.target.value)}
                    placeholder="Search workout..."
                />
            </form>
        </>
    )
}