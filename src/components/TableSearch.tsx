"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const TableSearch = () => {
  const router = useRouter();

  return (
    <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => {
          const value = e.target.value;
          const params = new URLSearchParams(window.location.search);
          if (value) {
            params.set("search", value);
          } else {
            params.delete("search");
          }
          router.push(`${window.location.pathname}?${params}`);
        }}
        className="w-[200px] p-2 bg-transparent outline-none"
      />
    </div>
  );
};

export default TableSearch;
