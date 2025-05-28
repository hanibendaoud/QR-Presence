export default function Input({ type, placeholder, name, value, onChange }) {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="pl-9 border border-gray-300 p-1.5 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm"
      required
    />
  );
}
