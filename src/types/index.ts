export interface Location {
  id?: number;             
  place: string;              
  quantity: number;           
  date: string;               
  assignedTo?: string;        
}

export interface InventoryItem {
  code: string;
  description: string;
  family: string;
  model: string;
  totalQuantity: number;
  availableQuantity: number;
  inUse: number;
  locations?: Location[]; 
}


export interface RequestItem {
  code: string;
  quantity: number;
  location: string;
  item: InventoryItem;
}