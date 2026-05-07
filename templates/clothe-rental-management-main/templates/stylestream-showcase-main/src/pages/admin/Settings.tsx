import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Plus, X } from 'lucide-react';

export default function Settings() {
  const [tags, setTags] = useState(['truyền thống', 'hiện đại', 'sang trọng', 'cưới', 'dạ hội', 'cocktail']);
  const [newTag, setNewTag] = useState('');
  const [showroomStatus, setShowroomStatus] = useState<'draft' | 'published'>('published');

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-sm text-muted-foreground">Quản lý cấu hình hệ thống</p>
      </div>

      <Tabs defaultValue="tags">
        <TabsList className="bg-muted rounded-xl">
          <TabsTrigger value="tags" className="rounded-lg">Tags & Danh mục</TabsTrigger>
          <TabsTrigger value="pricing" className="rounded-lg">Quy tắc giá</TabsTrigger>
          <TabsTrigger value="showroom" className="rounded-lg">Showroom</TabsTrigger>
        </TabsList>

        <TabsContent value="tags" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Tags sản phẩm</h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-accent rounded-full text-sm text-foreground">
                  {tag}
                  <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={e => setNewTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} placeholder="Thêm tag..." className="flex-1 px-3 py-2 bg-accent rounded-xl text-sm text-foreground border-0 outline-none focus:ring-2 focus:ring-ring" />
              <Button size="sm" className="rounded-xl" onClick={addTag}><Plus className="w-4 h-4" /></Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="font-semibold text-foreground">Quy tắc giá thuê</h3>
            <div className="space-y-3">
              {['Thuê 3+ ngày: Giảm 10%', 'Khách VIP: Giảm 15%', 'Cuối tuần: +20%'].map((rule, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-accent rounded-xl">
                  <span className="text-sm text-foreground">{rule}</span>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="showroom" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-foreground">Trạng thái Showroom</h3>
                <p className="text-sm text-muted-foreground">Hiện tại: {showroomStatus === 'published' ? 'Đã publish' : 'Draft'}</p>
              </div>
              <span className={`w-3 h-3 rounded-full ${showroomStatus === 'published' ? 'bg-success' : 'bg-warning'}`} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => { setShowroomStatus('draft'); toast({ title: 'Đã chuyển sang Draft' }); }}>Chuyển Draft</Button>
              <Button className="rounded-xl" onClick={() => { setShowroomStatus('published'); toast({ title: 'Đã Publish Showroom!' }); }}>Publish</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
