import React, {useEffect, useState} from "react";
import '../CSS/searchBar.css'
import { useQuery } from "@tanstack/react-query";

function filterDataByWeeks(data, numberOfWeeks) {
    const currentDate = new Date();
    const filteredData = [];
    if (data){
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
    }   
  
    return filteredData;
  }
export default function SearchBar({handleSearch , setData, search, setSearch, timeFrame, setDataStore, selectedUsername}){
    const [selectedSearch, setSelectedSearch] = useState('')
    const [searched, setSearched] = useState('')
    async function executeSearch(){
        if (selectedSearch){
            const results = await handleSearch(searched)
            setSelectedSearch('')
            if (results){
                return results
            }
            return []
        }
        return []
    }
    async function handleSubmit(e){
        e.preventDefault()
        setSearched(selectedSearch)
        setSearch(selectedSearch)
    }

    const { data: searchResult } = useQuery({
        queryKey: ["searchedExercise", searched, selectedUsername],
        queryFn: executeSearch,
        initialData: []
      },
      );
    
    useEffect(() =>{
        if (searchResult && searchResult.length !== 0){

            setDataStore(searchResult)
            setData(filterDataByWeeks(searchResult,timeFrame*4))
        }
    },[searchResult])
    useEffect(() => {
        setData(filterDataByWeeks(searchResult,timeFrame*4))
    }, [timeFrame])
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