import os
import torch
import numpy as np
from pathlib import Path

class FaceBankManager:
    def __init__(self, facebank_path='facebank'):
        self.facebank_path = Path(facebank_path)
        self.facebank_path.mkdir(exist_ok=True)
        self.embeddings = None
        self.names = np.array([''])
        self.load_facebank()
    
    def load_facebank(self):
        """Load facebank dari file"""
        embeddings_path = self.facebank_path / 'facebank.pth'
        names_path = self.facebank_path / 'names.npy'
        
        if embeddings_path.exists() and names_path.exists():
            self.embeddings = torch.load(embeddings_path)
            self.names = np.load(names_path)
            print(f"[FaceBank] Loaded {len(self.names) - 1} faces")
        else:
            self.embeddings = torch.empty(0, 512)
            self.names = np.array([''])
            print("[FaceBank] Initialized empty facebank")
    
    def save_facebank(self):
        """Simpan facebank ke file"""
        embeddings_path = self.facebank_path / 'facebank.pth'
        names_path = self.facebank_path / 'names.npy'
        
        torch.save(self.embeddings, embeddings_path)
        np.save(names_path, self.names)
        print(f"[FaceBank] Saved {len(self.names) - 1} faces")
    
    def add_face(self, name, embedding):
        """Tambah wajah baru ke facebank"""
        embedding = torch.from_numpy(embedding).float()
        
        if self.embeddings.shape[0] == 0:
            self.embeddings = embedding.unsqueeze(0)
        else:
            self.embeddings = torch.cat([self.embeddings, embedding.unsqueeze(0)])
        
        self.names = np.append(self.names, name)
        self.save_facebank()
        print(f"[FaceBank] Added face: {name}")
    
    def recognize(self, embedding, threshold=1.2):
        """Kenali wajah dari embedding"""
        if self.embeddings.shape[0] == 0:
            return "unknown", 0.0
        
        embedding = torch.from_numpy(embedding).float()
        
        # Hitung L2 distance
        diff = self.embeddings - embedding
        dist = torch.pow(diff, 2).sum(dim=1)
        
        # Cari jarak minimum
        min_dist, min_idx = torch.min(dist, dim=0)
        min_dist = min_dist.item()
        
        if min_dist < threshold:
            return self.names[min_idx.item() + 1], min_dist
        else:
            return "unknown", min_dist