import React, { useState, useMemo, useEffect } from 'react';
import { NavigationProps, ShoppingListItem, PageType } from '../types';
import { getShoppingList, updateShoppingListItem, deleteShoppingListItem, clearCheckedItems } from '../services/shoppingListService';
import PageHeader from '../components/PageHeader';
import { FEATURES } from '../constants';
import { ShoppingCart, Trash2, ArchiveX, Check } from 'lucide-react';

const feature = FEATURES.find(f => f.pageType === 'shoppingList')!;

const ShoppingListPage: React.FC<NavigationProps> = ({ navigateTo }) => {
    const [items, setItems] = useState<ShoppingListItem[]>([]);

    useEffect(() => {
        setItems(getShoppingList());
    }, []);

    const handleToggleCheck = (id: string) => {
        const item = items.find(i => i.id === id);
        if (item) {
            const newCheckedState = !item.isChecked;
            updateShoppingListItem(id, { isChecked: newCheckedState });
            setItems(items.map(i => i.id === id ? { ...i, isChecked: newCheckedState } : i));
        }
    };

    const handleDelete = (id: string) => {
        deleteShoppingListItem(id);
        setItems(items.filter(i => i.id !== id));
    };
    
    const handleClearChecked = () => {
        if (window.confirm('هل أنت متأكد من حذف جميع العناصر المحددة؟')) {
            clearCheckedItems();
            setItems(getShoppingList());
        }
    };

    const groupedItems = useMemo(() => {
        return items.reduce((acc, item) => {
            const feature = FEATURES.find(f => f.pageType === item.relatedFeature);
            const groupName = feature ? feature.title : 'عام';
            if (!acc[groupName]) {
                acc[groupName] = [];
            }
            acc[groupName].push(item);
            return acc;
        }, {} as Record<string, ShoppingListItem[]>);
    }, [items]);

    return (
        <div className="bg-gray-50 dark:bg-black min-h-screen">
            <PageHeader navigateTo={navigateTo} title={feature.title} Icon={feature.Icon} color={feature.color} />
            <main className="p-4">
                {items.length > 0 ? (
                    <>
                    <div className="mb-4 text-right">
                         <button onClick={handleClearChecked} disabled={!items.some(i => i.isChecked)} className="text-sm text-red-500 hover:underline disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1">
                             <Trash2 size={14} />
                             حذف العناصر المحددة
                         </button>
                    </div>
                    <div className="space-y-4">
                        {Object.entries(groupedItems).map(([groupName, groupItems]) => (
                            <div key={groupName} className="bg-white dark:bg-black p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">{groupName}</h3>
                                <ul className="space-y-2">
                                    {(groupItems as ShoppingListItem[]).map(item => (
                                        <li key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <button 
                                                    onClick={() => handleToggleCheck(item.id)} 
                                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${item.isChecked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                >
                                                   {item.isChecked && <Check size={16} className="text-white"/>}
                                                </button>
                                                <span className={`text-gray-800 dark:text-gray-200 transition-colors ${item.isChecked ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                                                    {item.name}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50 dark:hover:bg-gray-800 transition">
                                                <Trash2 size={16} />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                    </>
                ) : (
                    <div className="text-center py-12 px-4 bg-white dark:bg-black rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
                         <ArchiveX size={48} className="mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                        <h3 className="font-bold text-lg text-gray-700 dark:text-gray-200">قائمة التسوق فارغة</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            أضف المكونات والمنتجات من استشاراتك وستظهر هنا.
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ShoppingListPage;