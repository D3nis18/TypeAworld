import React, { useState, useEffect } from 'react';
import { Download, FileText, BookOpen, Edit, Save, X, Plus, Building2, Trash2, Image as ImageIcon } from 'lucide-react';
import { getCollection, addDocument, updateDocument, deleteDocument } from '../firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { getMemberPermissions, canManageDepartments } from '../utils/permissions';
import { jsPDF } from 'jspdf';

const CompanyProfile = () => {
  const { role, user } = useAuth();
  const [acts, setActs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [memberPermissions, setMemberPermissions] = useState({
    canEditCompanyProfile: false,
    canManageDepartments: false
  });
  const [editingHistory, setEditingHistory] = useState(false);
  const [editingObjects, setEditingObjects] = useState(false);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [showPostForm, setShowPostForm] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [companyHistory, setCompanyHistory] = useState('');
  const [companyObjects, setCompanyObjects] = useState([]);
  const [tempHistory, setTempHistory] = useState('');
  const [tempObjects, setTempObjects] = useState([]);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    head: ''
  });
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    images: []
  });
  const [showActForm, setShowActForm] = useState(false);
  const [actForm, setActForm] = useState({
    title: '',
    content: ''
  });
  
  const canDownload = role === 'Admin' || role === 'Secretary';
  const canEdit = role === 'Admin' || memberPermissions.canEditCompanyProfile;

  useEffect(() => {
    loadCompanyInfo();
    loadActs();
    loadDepartments();
    if (role && role !== 'Admin' && user) {
      loadMemberPermissions();
    }
  }, [role, user]);

  const loadMemberPermissions = async () => {
    const { getMemberPermissions } = await import('../utils/permissions');
    const permissions = await getMemberPermissions(user.email);
    setMemberPermissions(permissions);
  };

  const loadCompanyInfo = async () => {
    const historyResult = await getCollection('companyHistory');
    if (historyResult.success && historyResult.data.length > 0) {
      setCompanyHistory(historyResult.data[0].content);
    } else {
      setCompanyHistory(`The company was started by Kenyatta University students in their first year, aiming to target upcoming business opportunities inside and outside the campus without limitation. The first idea was supplying products, but the company remains open to all other business ventures that meet its objectives.`);
    }

    const objectsResult = await getCollection('companyObjects');
    if (objectsResult.success && objectsResult.data.length > 0) {
      setCompanyObjects(objectsResult.data[0].items);
    } else {
      setCompanyObjects([
        "To identify and pursue profitable business opportunities within and outside the campus",
        "To provide quality products and services to our target market",
        "To foster entrepreneurship and business skills among members",
        "To maintain financial stability and ensure sustainable growth",
        "To build strong partnerships with other businesses and organizations",
        "To create employment opportunities for members and the community"
      ]);
    }
  };

  const loadActs = async () => {
    const result = await getCollection('acts');
    if (result.success) {
      setActs(result.data);
    }
    setLoading(false);
  };

  const loadDepartments = async () => {
    const result = await getCollection('departments');
    if (result.success) {
      const depts = result.data;
      // Load posts for each department
      const departmentsWithPosts = await Promise.all(
        depts.map(async (dept) => {
          const postsResult = await getCollection('departmentPosts');
          if (postsResult.success) {
            const deptPosts = postsResult.data.filter(post => post.departmentId === dept.id);
            return { ...dept, posts: deptPosts };
          }
          return { ...dept, posts: [] };
        })
      );
      setDepartments(departmentsWithPosts);
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...departmentForm,
      author: user.email,
      authorName: user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    if (editingDepartment) {
      await updateDocument('departments', editingDepartment.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      setEditingDepartment(null);
    } else {
      await addDocument('departments', data);
    }

    setDepartmentForm({ name: '', description: '', head: '' });
    setShowDepartmentForm(false);
    loadDepartments();
  };

  const handleEditDepartment = (dept) => {
    setDepartmentForm({
      name: dept.name,
      description: dept.description,
      head: dept.head
    });
    setEditingDepartment(dept);
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      await deleteDocument('departments', id);
      loadDepartments();
    }
  };

  const handleAddPost = (dept) => {
    setSelectedDepartment(dept);
    setPostForm({ title: '', content: '', images: [] });
    setShowPostForm(true);
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...postForm,
      departmentId: selectedDepartment.id,
      departmentName: selectedDepartment.name,
      author: user.email,
      authorName: user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    await addDocument('departmentPosts', data);
    setPostForm({ title: '', content: '', images: [] });
    setShowPostForm(false);
    setSelectedDepartment(null);
    loadDepartments();
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostForm(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePostImage = (index) => {
    setPostForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleActSubmit = async (e) => {
    e.preventDefault();
    const data = {
      ...actForm,
      author: user.email,
      authorName: user.email.split('@')[0],
      createdAt: new Date().toISOString()
    };

    await addDocument('acts', data);
    setActForm({ title: '', content: '' });
    setShowActForm(false);
    loadActs();
  };

  const handleDeleteAct = async (id) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      await deleteDocument('acts', id);
      loadActs();
    }
  };

  const downloadHistory = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company History', 20, 20);
    doc.setFontSize(12);
    doc.text(companyHistory, 20, 40, { maxWidth: 170 });
    doc.save('company-history.pdf');
  };

  const downloadObjects = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company Objects', 20, 20);
    doc.setFontSize(12);
    let yPosition = 40;
    companyObjects.forEach((obj, index) => {
      doc.text(`${index + 1}. ${obj}`, 20, yPosition);
      yPosition += 10;
    });
    doc.save('company-objects.pdf');
  };

  const downloadAct = (act) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('TypeAworld - Company Acts & Articles', 20, 20);
    doc.setFontSize(14);
    doc.text(act.title, 20, 40);
    doc.setFontSize(12);
    doc.text(act.content, 20, 55, { maxWidth: 170 });
    doc.save(`${act.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  };

  const saveHistory = async () => {
    const historyResult = await getCollection('companyHistory');
    if (historyResult.success && historyResult.data.length > 0) {
      await updateDocument('companyHistory', historyResult.data[0].id, { content: tempHistory });
    } else {
      await addDocument('companyHistory', { content: tempHistory });
    }
    setCompanyHistory(tempHistory);
    setEditingHistory(false);
  };

  const saveObjects = async () => {
    const objectsResult = await getCollection('companyObjects');
    if (objectsResult.success && objectsResult.data.length > 0) {
      await updateDocument('companyObjects', objectsResult.data[0].id, { items: tempObjects });
    } else {
      await addDocument('companyObjects', { items: tempObjects });
    }
    setCompanyObjects(tempObjects);
    setEditingObjects(false);
  };

  const addObject = () => {
    setTempObjects([...tempObjects, '']);
  };

  const updateObject = (index, value) => {
    const newObjects = [...tempObjects];
    newObjects[index] = value;
    setTempObjects(newObjects);
  };

  const removeObject = (index) => {
    const newObjects = tempObjects.filter((_, i) => i !== index);
    setTempObjects(newObjects);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Company Profile</h1>

        {/* Company History */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Company History</h2>
            </div>
            <div className="flex gap-2">
              {canEdit && !editingHistory && (
                <button
                  onClick={() => { setEditingHistory(true); setTempHistory(companyHistory); }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit
                </button>
              )}
              {editingHistory && (
                <>
                  <button
                    onClick={saveHistory}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingHistory(false); setTempHistory(companyHistory); }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              )}
              {canDownload && (
                <button
                  onClick={downloadHistory}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
              )}
            </div>
          </div>
          {editingHistory ? (
            <textarea
              value={tempHistory}
              onChange={(e) => setTempHistory(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={6}
            />
          ) : (
            <p className="text-gray-700 leading-relaxed">{companyHistory}</p>
          )}
        </div>

        {/* Company Objects */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Company Objects</h2>
            </div>
            <div className="flex gap-2">
              {canEdit && !editingObjects && (
                <button
                  onClick={() => { setEditingObjects(true); setTempObjects([...companyObjects]); }}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit
                </button>
              )}
              {editingObjects && (
                <>
                  <button
                    onClick={saveObjects}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Save size={18} />
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingObjects(false); setTempObjects([...companyObjects]); }}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                </>
              )}
              {canDownload && (
                <button
                  onClick={downloadObjects}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Download size={18} />
                  Download
                </button>
              )}
            </div>
          </div>
          {editingObjects ? (
            <div className="space-y-3">
              {tempObjects.map((obj, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={obj}
                    onChange={(e) => updateObject(index, e.target.value)}
                    className="flex-1 input-field"
                    placeholder="Enter company object"
                  />
                  <button
                    onClick={() => removeObject(index)}
                    className="btn-danger"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={addObject}
                className="btn-secondary w-full"
              >
                + Add Object
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {companyObjects.map((obj, index) => (
                <li key={index} className="text-gray-700 flex items-start gap-2">
                  <span className="text-primary-600 font-semibold">{index + 1}.</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Departments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Building2 className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Departments</h2>
            </div>
            {canManageDepartments(role, memberPermissions) && (
              <button
                onClick={() => setShowDepartmentForm(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                Add Department
              </button>
            )}
          </div>

          {showDepartmentForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              <form onSubmit={handleDepartmentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Name</label>
                  <input
                    type="text"
                    value={departmentForm.name}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Marketing"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department Head</label>
                  <input
                    type="text"
                    value={departmentForm.head}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, head: e.target.value })}
                    className="input-field"
                    placeholder="e.g., John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={departmentForm.description}
                    onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                    className="input-field min-h-[100px]"
                    placeholder="Brief description of the department"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    {editingDepartment ? 'Update' : 'Add'} Department
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepartmentForm(false);
                      setEditingDepartment(null);
                      setDepartmentForm({ name: '', description: '', head: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {departments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No departments added yet.</p>
          ) : (
            <div className="grid gap-4">
              {departments.map((dept) => (
                <div key={dept.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{dept.name}</h3>
                      {dept.head && (
                        <p className="text-sm text-gray-600 mt-1">
                          <span className="font-medium">Head:</span> {dept.head}
                        </p>
                      )}
                      {dept.description && (
                        <p className="text-sm text-gray-600 mt-2">{dept.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        Added by {dept.authorName} on {new Date(dept.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {canManageDepartments(role, memberPermissions) && (
                        <>
                          <button
                            onClick={() => handleEditDepartment(dept)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteDepartment(dept.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleAddPost(dept)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Add Post"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Department Posts */}
                  {dept.posts && dept.posts.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Posts & News</h4>
                      <div className="space-y-3">
                        {dept.posts.map((post) => (
                          <div key={post.id} className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-start justify-between mb-2">
                              <h5 className="font-semibold text-gray-900">{post.title}</h5>
                              <span className="text-xs text-gray-400">
                                {new Date(post.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{post.content}</p>
                            {post.images && post.images.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {post.images.map((img, idx) => (
                                  <img key={idx} src={img} alt={`Post ${idx + 1}`} className="w-20 h-20 object-cover rounded" />
                                ))}
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Posted by {post.authorName}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Form Modal */}
        {showPostForm && selectedDepartment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  Add Post to {selectedDepartment.name}
                </h2>
                <button onClick={() => {
                  setShowPostForm(false);
                  setSelectedDepartment(null);
                  setPostForm({ title: '', content: '', images: [] });
                }} className="text-gray-500 hover:text-gray-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePostSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Post title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={postForm.content}
                    onChange={(e) => setPostForm({ ...postForm, content: e.target.value })}
                    className="input-field min-h-[120px]"
                    placeholder="Post content"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <ImageIcon size={16} className="inline mr-1" />
                    Attach Images
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  {postForm.images.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {postForm.images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <img src={img} alt={`Upload ${idx + 1}`} className="w-20 h-20 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => removePostImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="btn-primary">
                    Post
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPostForm(false);
                      setSelectedDepartment(null);
                      setPostForm({ title: '', content: '', images: [] });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Company Acts & Articles */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileText className="text-primary-600" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Company Acts & Articles</h2>
            </div>
            {canEdit && (
              <button
                onClick={() => setShowActForm(!showActForm)}
                className="btn-primary flex items-center gap-2"
              >
                <Plus size={18} />
                {showActForm ? 'Cancel' : 'Add Document'}
              </button>
            )}
          </div>

          {/* Admin Form to Add Act/Article */}
          {showActForm && canEdit && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Add New Document</h3>
              <form onSubmit={handleActSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={actForm.title}
                    onChange={(e) => setActForm({ ...actForm, title: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Company Act 2024"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                  <textarea
                    value={actForm.content}
                    onChange={(e) => setActForm({ ...actForm, content: e.target.value })}
                    className="input-field min-h-[150px]"
                    placeholder="Enter document content..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary">
                    Upload Document
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowActForm(false);
                      setActForm({ title: '', content: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : acts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No acts or articles uploaded yet.</p>
              {role !== 'Admin' && <p className="text-sm mt-2">Contact an administrator to add documents.</p>}
            </div>
          ) : (
            <div className="space-y-4">
              {acts.map((act) => (
                <div key={act.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{act.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Added on {new Date(act.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {canDownload && (
                        <button
                          onClick={() => downloadAct(act)}
                          className="btn-secondary flex items-center gap-2"
                        >
                          <Download size={16} />
                          Download
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteAct(act.id)}
                          className="btn-danger p-2"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mt-3 line-clamp-3">{act.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfile;
