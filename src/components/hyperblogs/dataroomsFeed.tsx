"use client";

import { hyperblogsCopy } from "@/content/hyperblogs";
import { Button } from "../ui/button";
import { useDataRoomsQuery } from "@/hooks";
import { useCallback, useEffect, useState } from "react";
import { DataRoomInfo, DataRoomListResponse } from "@/types";


export default function DataroomsFeed() {
  const { data, isLoading, isError, error } = useDataRoomsQuery();
  const { title, description, dataroomTitle } = hyperblogsCopy;

  const [dataRooms, setDataRooms] = useState<DataRoomInfo[]>([]);

  const fetchDataRooms = useCallback(async () => {
    const response = await fetch("/api/datarooms?limit=50&offset=0");
    const data: DataRoomListResponse = await response.json();
    console.log("dataRooms", data);
    setDataRooms(data.datarooms);
  }, []);

  useEffect(() => {
    fetchDataRooms();
  }, [fetchDataRooms]);
  
  return (
    <>
      <div className="mt-6 font-montserrat text-lg lg:text-[2rem] font-black lg:font-bold">
        {dataroomTitle}
      </div>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {dataRooms?.map((dataroom) => (
          <div key={dataroom.id}>
            <h3>{dataroom.description}</h3>
          </div>
        ))}
      </div>
    </>
  );
}