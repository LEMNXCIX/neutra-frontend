'use client';

import { useEffect, useState } from 'react';
import { bookingService, Staff } from '@/services/booking.service';

export default function AdminStaffPage() {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        bio: '',
    });

    useEffect(() => {
        loadStaff();
    }, []);

    const loadStaff = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getStaff(false); // Include inactive
            setStaff(data);
        } catch (err) {
            console.error('Error loading staff:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch('/api/staff', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                setShowForm(false);
                setFormData({ name: '', email: '', phone: '', bio: '' });
                await loadStaff();
            }
        } catch (err) {
            console.error('Error creating staff:', err);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Manage Staff</h1>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                    {showForm ? 'Cancel' : '+ Add Staff'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white border rounded-lg p-6 mb-8">
                    <h2 className="text-xl font-semibold mb-4">New Staff Member</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Name *</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border rounded px-3 py-2"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full border rounded px-3 py-2"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Bio</label>
                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                className="w-full border rounded px-3 py-2"
                                rows={3}
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                        >
                            Create Staff Member
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {staff.map((member) => (
                        <div key={member.id} className="bg-white border rounded-lg p-6">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-lg font-semibold">{member.name}</h3>
                                <span className={`px-2 py-1 text-xs rounded ${member.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {member.active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {member.bio && (
                                <p className="text-sm text-gray-600 mb-4">{member.bio}</p>
                            )}

                            <div className="space-y-2 text-sm">
                                {member.email && (
                                    <div className="flex items-center text-gray-500">
                                        <span className="mr-2">📧</span>
                                        {member.email}
                                    </div>
                                )}
                                {member.phone && (
                                    <div className="flex items-center text-gray-500">
                                        <span className="mr-2">📱</span>
                                        {member.phone}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
