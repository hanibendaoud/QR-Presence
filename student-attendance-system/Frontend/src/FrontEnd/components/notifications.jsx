import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import notification from "../../FrontEnd/assets/notification.svg"

export default function Notifications() {
  return (
    <Popover className="relative mr-[10px]">
      <PopoverTrigger>
        <div className="bg-gray-200 min-w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-gray-300 transition cursor-pointer">
          <img src={notification} alt="notifications" className="w-[20px] h-[20px]" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-4 bg-white border rounded-md shadow-lg">
        No notifications yet. {/* add your API here for notifications */}
      </PopoverContent>
    </Popover>
  )
}
