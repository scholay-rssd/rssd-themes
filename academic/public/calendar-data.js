// HTTP caches immutable content URLs across visits. The tiny manifest is
// revalidated, so a publication immediately points new visits to new content.
export function createCalendarLoader(fetcher=fetch){
  const pending=new Map();
  const get=path=>{
    if(!pending.has(path))pending.set(path,(async()=>{
      const response=await fetcher(path);
      if(!response.ok){const error=new Error('数据文件不可用，请重试');error.status=response.status;throw error;}
      return response.json();
    })().catch(error=>{pending.delete(path);throw error;}));
    return pending.get(path);
  };
  const manifest=async()=>{
    const value=await get('/calendar-index.json');
    if(value.version!==1||!['year','history'].every(kind=>/^\/calendar-data\/[a-f0-9]{64}\.json$/.test(value[kind]))){
      pending.delete('/calendar-index.json');throw new Error('日历索引格式无效');
    }
    return value;
  };
  const load=async kind=>{
    if(!['year','history'].includes(kind))throw new Error('未知日历类型');
    for(let attempt=0;attempt<2;attempt++){
      try{return await get((await manifest())[kind]);}
      catch(error){if(error.status!==404||attempt)throw error;pending.delete('/calendar-index.json');}
    }
  };
  const record=async(kind,id)=>{
    for(let attempt=0;attempt<2;attempt++){
      const item=(await load(kind)).find(item=>item.id===id);
      if(!item?.detailUrl)return item;
      if(!/^\/calendar-data\/[a-f0-9]{64}\.json$/.test(item.detailUrl))throw new Error('日历正文地址无效');
      try{return await get(item.detailUrl);}
      catch(error){
        if(error.status!==404||attempt)throw error;
        // A release may change between the list and detail requests.
        const previous=await manifest();pending.delete(previous[kind]);pending.delete('/calendar-index.json');
      }
    }
  };
  return {load,record};
}
