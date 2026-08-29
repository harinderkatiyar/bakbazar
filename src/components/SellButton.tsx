import { useNavigate, useLocation } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/context/AuthContext";

export const SellButton = ({ className = "" }: { className?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (user) {
      navigate("/sell");
    } else {
      navigate("/login", { state: { from: "/sell" } });
    }
  };

  return (
    <Button
      onClick={handleClick}
      className={`gap-1.5 rounded-full bg-[#C4432B] px-4 text-white hover:bg-[#a8371f] ${className}`}
    >
      <Plus className="h-4 w-4" />
      Sell
    </Button>
  );
};