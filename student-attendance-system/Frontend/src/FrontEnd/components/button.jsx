export default function Button(props){
  return(
    <button type={props.type} onClick={props.onClick} className={`w-full p-1.5 rounded-md text-sm ${props.className}`}> {props.icon && <img src={props.icon} alt="icon" className="w-3.5 h-3.5" />} {props.text} </button>
  )
}
