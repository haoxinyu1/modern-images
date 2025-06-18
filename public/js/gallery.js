document.addEventListener('DOMContentLoaded', () => {
    // 分页相关变量
    let currentPage = 1;
    let totalPages = 1;
    let imagesPerPage = parseInt(localStorage.getItem('galleryImagesPerPage')) || 50;
    let currentStorageFilter = ''; // 当前存储类型过滤器
    
    // 初始化全局图片数组
    window.galleryImages = [];
    
    // DOM 元素引用
    const perPageSelect = document.getElementById('perPageLimit');
    const storageFilter = document.getElementById('storageFilter');
    const prevPageBtn = document.getElementById('prevPageBtn');
    const nextPageBtn = document.getElementById('nextPageBtn');
    const prevPageBtnBottom = document.getElementById('prevPageBtnBottom');
    const nextPageBtnBottom = document.getElementById('nextPageBtnBottom');
    const pageInfo = document.getElementById('pageInfo');
    const paginationInfo = document.getElementById('paginationInfo');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const deleteImagesBtn = document.getElementById('deleteImagesBtn');
    const deleteImagesBtnBottom = document.getElementById('deleteImagesBtnBottom');
  
  // 设置初始视图状态
  const gallery = document.getElementById('gallery');
  if (gridViewBtn && listViewBtn && gallery) {
    // 从 localStorage 获取用户偏好的视图类型
    const savedView = localStorage.getItem('galleryView') || 'grid';
    
    // 保存当前的class列表，包括可能的gallery-mosaic类
    const currentClasses = Array.from(gallery.classList);
    const hasMosaic = currentClasses.includes('gallery-mosaic');
    
    if (savedView === 'grid') {
      gallery.className = 'gallery-grid';
      gridViewBtn.classList.add('active');
    } else {
      gallery.className = 'gallery-list';
      listViewBtn.classList.add('active');
    }
    
    // 恢复马赛克状态
    if (hasMosaic) {
      gallery.classList.add('gallery-mosaic');
    }
    
    // 添加视图切换事件监听
    gridViewBtn.addEventListener('click', () => {
      // 保存当前的马赛克状态
      const hasMosaic = gallery.classList.contains('gallery-mosaic');
      
      // 更新视图类型
      gallery.className = 'gallery-grid';
      
      // 如果之前是马赛克状态，重新添加马赛克类
      if (hasMosaic) {
        gallery.classList.add('gallery-mosaic');
      }
      
      localStorage.setItem('galleryView', 'grid');
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
      loadGalleryPaged();
    });
    
    listViewBtn.addEventListener('click', () => {
      // 保存当前的马赛克状态
      const hasMosaic = gallery.classList.contains('gallery-mosaic');
      
      // 更新视图类型
      gallery.className = 'gallery-list';
      
      // 如果之前是马赛克状态，重新添加马赛克类
      if (hasMosaic) {
        gallery.classList.add('gallery-mosaic');
      }
      
      localStorage.setItem('galleryView', 'list');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
      loadGalleryPaged();
    });
  }
  
  // 设置每页图片数量的下拉选择框
  if (perPageSelect) {
    // 设置初始选定值
    perPageSelect.value = imagesPerPage;
    
    // 监听变更事件
    perPageSelect.addEventListener('change', () => {
      imagesPerPage = parseInt(perPageSelect.value);
      localStorage.setItem('galleryImagesPerPage', imagesPerPage);
      currentPage = 1; // 重置为第一页
      loadGalleryPaged();
    });
  }

  // 设置存储类型过滤器
  if (storageFilter) {
    // 监听变更事件
    storageFilter.addEventListener('change', () => {
      currentStorageFilter = storageFilter.value;
      currentPage = 1; // 重置为第一页
      loadGalleryPaged();
    });
    
    // 加载存储统计信息并更新选项显示
    loadStorageStats();
  }
  
  // 上一页按钮
  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadGalleryPaged();
      }
    });
  }
  
  // 底部上一页按钮
  if (prevPageBtnBottom) {
    prevPageBtnBottom.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadGalleryPaged();
      }
    });
  }
  
  // 下一页按钮
  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadGalleryPaged();
      }
    });
  }
  
  // 底部下一页按钮
  if (nextPageBtnBottom) {
    nextPageBtnBottom.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadGalleryPaged();
      }
    });
  }
  
  // 删除按钮事件
  if (deleteImagesBtn) {
    deleteImagesBtn.addEventListener('click', () => {
      handleBatchDelete();
    });
  }
  
  // 底部删除按钮事件
  if (deleteImagesBtnBottom) {
    deleteImagesBtnBottom.addEventListener('click', () => {
      handleBatchDelete();
    });
  }
  
  // 生成分页页码，直接使用全局的 currentPage 用来判断当前激活的页码
  function generatePaginationNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const pageNumbersBottomContainer = document.getElementById('pageNumbersBottom');
    if (!pageNumbersContainer && !pageNumbersBottomContainer) return;
    
    // 生成上方分页导航
    if (pageNumbersContainer) {
      generatePaginationForContainer(pageNumbersContainer);
    }
    
    // 生成底部分页导航
    if (pageNumbersBottomContainer) {
      generatePaginationForContainer(pageNumbersBottomContainer);
    }
    
    // 为指定容器生成分页页码
    function generatePaginationForContainer(container) {
      container.innerHTML = '';
      
      // 最多显示的页码数量
      const maxPageButtons = 5;
      
      // 如果总页数小于等于最大显示数，直接显示所有页码
      if (totalPages <= maxPageButtons) {
        for (let i = 1; i <= totalPages; i++) {
          addPageNumber(i, container);
        }
      } else {
        // 总页数大于最大显示数，显示部分页码
        
        // 始终显示第一页
        addPageNumber(1, container);
        
        // 计算中间部分应该显示的页码
        let startPage = Math.max(2, currentPage - Math.floor((maxPageButtons - 2) / 2));
        let endPage = Math.min(totalPages - 1, startPage + maxPageButtons - 3);
        
        // 调整起始页码，确保显示足够数量的页码
        if (endPage - startPage < maxPageButtons - 3) {
          startPage = Math.max(2, endPage - (maxPageButtons - 3));
        }
        
        // 如果当前页接近第一页，不显示前省略号
        if (startPage > 2) {
          addEllipsis(container);
        }
        
        // 显示中间页码
        for (let i = startPage; i <= endPage; i++) {
          addPageNumber(i, container);
        }
        
        // 如果当前页接近最后一页，不显示后省略号
        if (endPage < totalPages - 1) {
          addEllipsis(container);
        }
        
        // 始终显示最后一页
        addPageNumber(totalPages, container);
      }
    }
    
    // 添加页码按钮的辅助函数
    function addPageNumber(pageNum, container) {
      const pageButton = document.createElement('div');
      pageButton.classList.add('page-number');
      if (pageNum === currentPage) {
        pageButton.classList.add('active');
      }
      pageButton.textContent = pageNum;
      pageButton.addEventListener('click', (e) => {
        // 阻止默认行为及事件传播
        e.preventDefault();
        e.stopPropagation();
        
        if (pageNum !== currentPage) {
          currentPage = pageNum;
          loadGalleryPaged();
        }
      });
      container.appendChild(pageButton);
    }
    
    // 添加省略号的辅助函数
    function addEllipsis(container) {
      const ellipsis = document.createElement('div');
      ellipsis.classList.add('page-number', 'page-ellipsis');
      ellipsis.textContent = '...';
      container.appendChild(ellipsis);
    }
  }
  
  // 加载分页图片库 - 保持视图类型不变
  async function loadGalleryPaged() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    // 保存当前的class列表，包括可能的gallery-mosaic类
    const currentClasses = Array.from(gallery.classList);
    const hasMosaic = currentClasses.includes('gallery-mosaic');
    
    // 显示加载状态
    gallery.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
            <line x1="12" y1="2" x2="12" y2="6"></line>
            <line x1="12" y1="18" x2="12" y2="22"></line>
            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
            <line x1="2" y1="12" x2="6" y2="12"></line>
            <line x1="18" y1="12" x2="22" y2="12"></line>
            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
          </svg>
        </div>
        <p>正在加载图片...</p>
      </div>
    `;
    
    try {
      // 构建查询参数，包含存储类型过滤
      let queryParams = `page=${currentPage}&limit=${imagesPerPage}`;
      if (currentStorageFilter) {
        queryParams += `&storage=${currentStorageFilter}`;
      }
      
      const res = await fetch(`/images/paged?${queryParams}`);
      const result = await res.json();
      
      if (result.success) {
        // 更新分页信息
        const { pagination } = result;
        totalPages = pagination.totalPages;
        
        // 更新分页控件状态，并同步全局 currentPage（与服务器返回一致）
        updatePaginationControls(pagination);
        
        // 恢复原来的视图类型
        const savedView = localStorage.getItem('galleryView') || 'grid';
        gallery.className = savedView === 'grid' ? 'gallery-grid' : 'gallery-list';
        
        // 如果之前有马赛克类，重新添加
        if (hasMosaic) {
          gallery.classList.add('gallery-mosaic');
        }
        
        // 渲染图片 - 统一使用全局 galleryImages 变量
        window.galleryImages = result.images; // 设置全局变量用于模态框
        renderGallery(result.images);
        
        if (result.images.length === 0) {
          gallery.innerHTML = '<div class="empty-gallery">暂无图片，请先上传</div>';
        }
      } else {
        showToast('获取图片列表失败', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('获取图片列表时发生错误', 'error');
      gallery.innerHTML = '<div class="error-message">加载图片失败，请刷新页面重试</div>';
    }
  }
  
  // 更新分页控件状态
  function updatePaginationControls(pagination) {
    const { total, page, limit, totalPages } = pagination;
    
    // 同步全局 currentPage 与服务器返回的页码
    currentPage = page;
    
    // 生成页码
    generatePaginationNumbers(totalPages);
    
    // 更新分页详情
    if (paginationInfo) {
      const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
      const endItem = Math.min(page * limit, total);
      paginationInfo.textContent = `显示 ${startItem}-${endItem}，共 ${total} 张图片`;
    }
    
    // 更新按钮状态
    if (prevPageBtn) {
      prevPageBtn.disabled = page <= 1;
    }
    
    if (nextPageBtn) {
      nextPageBtn.disabled = page >= totalPages;
    }
    
    // 更新底部按钮状态
    if (prevPageBtnBottom) {
      prevPageBtnBottom.disabled = page <= 1;
    }
    
    if (nextPageBtnBottom) {
      nextPageBtnBottom.disabled = page >= totalPages;
    }
  }
  
  // 以下是图片库选择、右键菜单及拖拽排序相关代码
  
  // 直接使用window.galleryImages，不再定义局部变量
  let currentImageIndex = -1;
  let selectedIndices = [];
  let lastSelectedIndex = null;
  
  // 用于缓存已加载图片的对象
  const imageCache = {};
  
  // 辅助函数：清除所有选中的图片
  function clearAllSelections() {
    selectedIndices = [];
    const items = document.querySelectorAll('.gallery-item');
    items.forEach(item => item.classList.remove('selected'));
  }
  
  function selectItem(index) {
    selectedIndices.push(index);
    const items = document.querySelectorAll('.gallery-item');
    if (items[index]) {
      items[index].classList.add('selected');
    }
  }
  
  function toggleSelection(index) {
    const items = document.querySelectorAll('.gallery-item');
    if (selectedIndices.includes(index)) {
      selectedIndices = selectedIndices.filter(i => i !== index);
      if (items[index]) items[index].classList.remove('selected');
    } else {
      selectedIndices.push(index);
      if (items[index]) items[index].classList.add('selected');
    }
  }
  
  // 渲染图片库并增强 UI
  function renderGallery(images) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    // 保存当前的class列表，包括可能的gallery-mosaic类
    const currentClasses = Array.from(gallery.classList);
    const hasMosaic = currentClasses.includes('gallery-mosaic');
    
    gallery.innerHTML = '';
    
    // 判断当前视图类型
    const savedView = localStorage.getItem('galleryView') || 'grid';
    const isGridView = savedView === 'grid';
    
    // 重新设置基本类名
    gallery.className = isGridView ? 'gallery-grid' : 'gallery-list';
    
    // 如果之前有马赛克类，重新添加
    if (hasMosaic) {
      gallery.classList.add('gallery-mosaic');
    }
    
    images.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'gallery-item';
      item.dataset.index = index;
      
      // 确保设置图片的ID，用于删除操作
      if (img._id) {
        item.dataset.id = img._id;
      }
      
      if (isGridView) {
        item.classList.add('gallery-item-grid');
        // 使用空白图片占位，然后懒加载，添加手机端复制按钮
        item.innerHTML = `
          <div class="gallery-img-container">
            <div class="loading-placeholder"></div>
            <img class="gallery-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                 data-src="${img.url}" alt="${img.filename}" loading="lazy" />
            <div class="filename">${img.filename}</div>
            <!-- 手机端复制按钮 -->
            <button class="mobile-copy-btn" data-index="${index}" title="复制链接">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        `;
      } else {
        item.classList.add('gallery-item-list');
        item.innerHTML = `
          <div class="gallery-img-container">
            <div class="loading-placeholder"></div>
            <img class="gallery-img" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                 data-src="${img.url}" alt="${img.filename}" loading="lazy" />
            <!-- 手机端复制按钮 -->
            <button class="mobile-copy-btn" data-index="${index}" title="复制链接">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
          <div class="gallery-details">
            <div class="filename">${img.filename}</div>
            <div class="file-info">
              ${formatBytes(img.fileSize)} · ${img.format} · ${img.storage === 'local' ? '本地存储' : '远程存储'}
            </div>
            <div class="file-time">${img.uploadTime}</div>
          </div>
        `;
      }
      
      // 修复：改进点击事件处理，处理冒泡问题以修复Ctrl+点击选择
      const handleGalleryItemClick = (e) => {
        if (e.button !== 0) return; // 仅处理左键点击
        
        // 阻止事件冒泡
        e.stopPropagation();
        
        if (e.ctrlKey || e.metaKey) {
          // Ctrl/Cmd + 点击：切换选中状态
          toggleSelection(index);
          lastSelectedIndex = index;
        } else if (e.shiftKey) {
          // Shift + 点击：选择连续范围
          if (lastSelectedIndex === null) lastSelectedIndex = index;
          clearAllSelections();
          const start = Math.min(lastSelectedIndex, index);
          const end = Math.max(lastSelectedIndex, index);
          for (let i = start; i <= end; i++) {
            selectItem(i);
          }
        } else {
          // 普通点击：清除其他选择并打开图片
          clearAllSelections();
          selectItem(index);
          lastSelectedIndex = index;
          currentImageIndex = index;
          showImageModal(img);
        }
      };
      
      // 直接绑定到整个item元素，确保点击任何区域都能被捕获
      item.addEventListener('click', handleGalleryItemClick);
      
      // 手机端复制按钮点击事件
      const mobileCopyBtn = item.querySelector('.mobile-copy-btn');
      if (mobileCopyBtn) {
        mobileCopyBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // 显示手机端复制菜单
          showMobileCopyMenu(e, img, index);
        });
      }
      
      // 右键点击处理：显示上下文菜单
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        let selectedItems = [];
        if (selectedIndices.length > 0 && selectedIndices.includes(index)) {
          // 如果点击已选中的项目，使用所有选中的项目
          selectedItems = selectedIndices.map(i => window.galleryImages[i]);
        } else {
          clearAllSelections();
          selectItem(index);
          selectedItems = [img];
        }
        
        currentImageIndex = index;
        showContextMenu(e, selectedItems);
      });
      
      gallery.appendChild(item);
    });
    
    // 初始化懒加载
    initLazyLoading();
  }
  
  // 实现图片懒加载
  function initLazyLoading() {
    const lazyImages = document.querySelectorAll('.gallery-img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.getAttribute('data-src');
            
            img.onload = function() {
              const container = img.closest('.gallery-img-container');
              const placeholder = container.querySelector('.loading-placeholder');
              if (placeholder) {
                placeholder.style.display = 'none';
              }
              img.classList.add('loaded');
            };
            
            img.setAttribute('src', src);
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      lazyImages.forEach(img => {
        imageObserver.observe(img);
      });
    } else {
      lazyImages.forEach(img => {
        img.setAttribute('src', img.getAttribute('data-src'));
        img.removeAttribute('data-src');
      });
    }
  }
  
  // 上下文菜单相关功能
  
  function createContextMenu() {
    let menuDiv = document.getElementById('contextMenu');
    
    if (!menuDiv) {
      menuDiv = document.createElement('div');
      menuDiv.id = 'contextMenu';
      menuDiv.className = 'context-menu';
      document.body.appendChild(menuDiv);
    }
    
    return menuDiv;
  }
  
  function showContextMenu(event, imagesSelected) {
    const menu = createContextMenu();
    
    menu.style.top = `${event.pageY}px`;
    menu.style.left = `${event.pageX}px`;
    menu.style.display = 'block';
    
    const hasMultiple = imagesSelected.length > 1;
    
    // 此处保留复制和查看详情等菜单项，删除操作不再出现在右键菜单中
    menu.innerHTML = `
      <div class="context-menu-item" id="copyUrl">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
        复制${hasMultiple ? '所有' : ''}图片链接
      </div>
      <div class="context-menu-item" id="copyHTML">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
        复制 HTML 代码
      </div>
      <div class="context-menu-item" id="copyMarkdown">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        复制 Markdown 代码
      </div>
      <div class="context-menu-item" id="copyForum">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
        </svg>
        复制论坛格式
      </div>
      <div class="context-menu-item" id="openInTab">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 8px">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
        在新标签页打开
      </div>
    `;
    
    // 添加复制功能
    document.getElementById('copyUrl').addEventListener('click', () => {
      const text = imagesSelected.map(img => img.url).join('\n');
      copyToClipboard(text, hasMultiple ? '所有图片链接已复制' : '图片链接已复制');
      menu.style.display = 'none';
    });
    
    document.getElementById('copyHTML').addEventListener('click', () => {
      const text = imagesSelected.map(img => `<img src="${img.url}" alt="${img.filename}" />`).join('\n');
      copyToClipboard(text, 'HTML代码已复制');
      menu.style.display = 'none';
    });
    
    document.getElementById('copyMarkdown').addEventListener('click', () => {
      const text = imagesSelected.map(img => `![${img.filename}](${img.url})`).join('\n');
      copyToClipboard(text, 'Markdown代码已复制');
      menu.style.display = 'none';
    });
    
    document.getElementById('copyForum').addEventListener('click', () => {
      const text = imagesSelected.map(img => `[img]${img.url}[/img]`).join('\n');
      copyToClipboard(text, '论坛格式代码已复制');
      menu.style.display = 'none';
    });
    
    // 新增：在新标签页打开图片
    document.getElementById('openInTab').addEventListener('click', () => {
      if (imagesSelected.length > 0) {
        // 只打开第一张选中的图片
        window.open(imagesSelected[0].url, '_blank');
      }
      menu.style.display = 'none';
    });
    
    // 点击其他地方关闭菜单
    const hideMenu = (e) => {
      if (!menu.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', hideMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', hideMenu);
    }, 10);
  }
  
  // 手机端复制菜单
  function showMobileCopyMenu(event, img, index) {
    // 移除已存在的手机端菜单
    const existingMenu = document.getElementById('mobileCopyMenu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // 创建手机端复制菜单
    const menu = document.createElement('div');
    menu.id = 'mobileCopyMenu';
    menu.className = 'mobile-copy-menu';
    
    menu.innerHTML = `
      <div class="mobile-copy-menu-backdrop"></div>
      <div class="mobile-copy-menu-content">
        <div class="mobile-copy-menu-header">
          <div class="mobile-copy-menu-title">图片操作</div>
          <button class="mobile-copy-menu-close">&times;</button>
        </div>
        <div class="mobile-copy-menu-body">
          <div class="mobile-copy-menu-item" data-action="copyUrl">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>复制图片链接</span>
          </div>
          <div class="mobile-copy-menu-item" data-action="copyHTML">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 18 22 12 16 6"></polyline>
              <polyline points="8 6 2 12 8 18"></polyline>
            </svg>
            <span>复制 HTML 代码</span>
          </div>
          <div class="mobile-copy-menu-item" data-action="copyMarkdown">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span>复制 Markdown 代码</span>
          </div>
          <div class="mobile-copy-menu-item" data-action="copyForum">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            <span>复制论坛格式</span>
          </div>
          <div class="mobile-copy-menu-item" data-action="openInTab">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            <span>在新标签页打开</span>
          </div>
          <div class="mobile-copy-menu-divider"></div>
          <div class="mobile-copy-menu-item mobile-copy-menu-item-danger" data-action="deleteImage">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>
              <path d="M10 11v6"></path>
              <path d="M14 11v6"></path>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>
            </svg>
            <span>删除图片</span>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(menu);
    
    // 添加事件监听器
    const closeBtn = menu.querySelector('.mobile-copy-menu-close');
    const backdrop = menu.querySelector('.mobile-copy-menu-backdrop');
    const menuItems = menu.querySelectorAll('.mobile-copy-menu-item');
    
    // 关闭菜单函数
    const closeMenu = () => {
      menu.classList.add('closing');
      setTimeout(() => {
        menu.remove();
      }, 300);
    };
    
    // 关闭按钮和背景点击事件
    closeBtn.addEventListener('click', closeMenu);
    backdrop.addEventListener('click', closeMenu);
    
    // 菜单项点击事件
    menuItems.forEach(item => {
      item.addEventListener('click', async () => {
        const action = item.getAttribute('data-action');
        
        switch (action) {
          case 'copyUrl':
            copyToClipboard(img.url, '图片链接已复制');
            break;
          case 'copyHTML':
            copyToClipboard(`<img src="${img.url}" alt="${img.filename}" />`, 'HTML代码已复制');
            break;
          case 'copyMarkdown':
            copyToClipboard(`![${img.filename}](${img.url})`, 'Markdown代码已复制');
            break;
          case 'copyForum':
            copyToClipboard(`[img]${img.url}[/img]`, '论坛格式代码已复制');
            break;
          case 'openInTab':
            window.open(img.url, '_blank');
            showToast('已在新标签页打开图片');
            break;
          case 'deleteImage':
            // 处理单张图片删除
            await handleSingleImageDelete(img, index);
            break;
        }
        
        closeMenu();
      });
    });
    
    // 显示菜单动画
    setTimeout(() => {
      menu.classList.add('show');
    }, 10);
  }
  
  // 辅助剪贴板函数
  function copyToClipboard(text, successMessage) {
    if (!text) {
      showToast('没有可复制的内容', 'error');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(successMessage))
        .catch((err) => {
          console.error('复制失败:', err);
          fallbackCopy(text, successMessage);
        });
    } else {
      fallbackCopy(text, successMessage);
    }
  }
  
  function fallbackCopy(text, successMessage) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(successMessage);
      } else {
        showToast('复制失败，请手动复制', 'error');
      }
      document.body.removeChild(textArea);
    } catch (err) {
      console.error('备用复制方法失败:', err);
      showToast('复制失败，请手动复制', 'error');
    }
  }
  
  // 图片模态框功能
  function showImageModal(img) {
    if (!imageModal) {
      imageModal = document.createElement('div');
      imageModal.id = 'imageModal';
      imageModal.className = 'modal-backdrop';
      document.body.appendChild(imageModal);
      
      imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
          closeModal();
        }
      });
    }
    
    // 先隐藏模态框，等尺寸计算完成后再显示
    imageModal.classList.remove('show');
    
    // 创建临时图片对象预加载并计算尺寸
    const tempImg = new Image();
    
    tempImg.onload = () => {
      // 获取图片尺寸
      const imgWidth = tempImg.width;
      const imgHeight = tempImg.height;
      
      // 计算最佳容器尺寸
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const imgRatio = imgWidth / imgHeight;
      const maxModalWidth = viewportWidth * 0.9;
      const maxModalHeight = viewportHeight * 0.85;
      
      let containerWidth, containerHeight;
      
      if (imgRatio > 1) {
        // 横向图片
        containerWidth = Math.min(maxModalWidth, imgWidth);
        containerHeight = containerWidth / imgRatio;
        
        if (containerHeight > maxModalHeight) {
          containerHeight = maxModalHeight;
          containerWidth = containerHeight * imgRatio;
        }
      } else {
        // 竖向图片
        containerHeight = Math.min(maxModalHeight, imgHeight);
        containerWidth = containerHeight * imgRatio;
        
        if (containerWidth > maxModalWidth) {
          containerWidth = maxModalWidth;
          containerHeight = containerWidth / imgRatio;
        }
      }
      
      // 设置最小宽度
      containerWidth = Math.max(containerWidth, 300);
      
      // 现在创建模态框内容，并应用计算好的尺寸
      imageModal.innerHTML = `
        <div class="modal-container modal-image-only" style="width: ${Math.round(containerWidth)}px; max-width: ${Math.round(containerWidth)}px;">
          <div class="modal-header">
            <div class="modal-title">${img.filename}</div>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="image-info">
              <span class="image-size">${formatBytes(img.fileSize)}</span>
              <span class="image-time">${img.uploadTime}</span>
            </div>
            <div class="image-preview">
              <div class="image-loading">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin">
                  <line x1="12" y1="2" x2="12" y2="6"></line>
                  <line x1="12" y1="18" x2="12" y2="22"></line>
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                  <line x1="2" y1="12" x2="6" y2="12"></line>
                  <line x1="18" y1="12" x2="22" y2="12"></line>
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                </svg>
              </div>
              <img src="${img.url}" alt="${img.filename}" class="modal-image" style="display: none;">
            </div>
          </div>
          <div class="modal-navigation">
            <button class="nav-prev" title="上一张">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button class="nav-next" title="下一张">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      `;
      
      // 现在显示模态框
      imageModal.classList.add('show');
      
      const closeBtn = imageModal.querySelector('.modal-close');
      const prevBtn = imageModal.querySelector('.nav-prev');
      const nextBtn = imageModal.querySelector('.nav-next');
      
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
      if (prevBtn) prevBtn.addEventListener('click', navigatePrev);
      if (nextBtn) nextBtn.addEventListener('click', navigateNext);
      
      if (keyNavigationListener) {
        document.removeEventListener('keydown', keyNavigationListener);
      }
      
      keyNavigationListener = (e) => {
        if (e.key === 'Escape') {
          closeModal();
        } else if (e.key === 'ArrowLeft') {
          navigatePrev();
        } else if (e.key === 'ArrowRight') {
          navigateNext();
        }
      };
      
      document.addEventListener('keydown', keyNavigationListener);
      
      const modalContainer = imageModal.querySelector('.modal-container');
      const modalImg = imageModal.querySelector('.modal-image');
      const loadingElement = imageModal.querySelector('.image-loading');
      
      // 存储当前图片信息，用于窗口大小变化时重新计算
      let currentImgWidth = imgWidth;
      let currentImgHeight = imgHeight;
      
      // 窗口大小变化时重新调整图片尺寸
      const resizeHandler = () => {
        if (currentImgWidth && currentImgHeight) {
          adjustImageSize(currentImgWidth, currentImgHeight);
        }
      };
      
      // 添加窗口大小变化监听
      window.addEventListener('resize', resizeHandler);
      
      // 调整图片尺寸的函数
      const adjustImageSize = (imgWidth, imgHeight) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算图片比例
        const imgRatio = imgWidth / imgHeight;
        
        // 计算最佳显示尺寸
        const maxModalWidth = viewportWidth * 0.9;
        const maxModalHeight = viewportHeight * 0.85;
        
        // 计算理想容器尺寸，保持图片比例
        let containerWidth, containerHeight;
        
        // 根据图片比例和视口大小计算最佳容器尺寸
        if (imgRatio > 1) {
          // 横向图片
          containerWidth = Math.min(maxModalWidth, imgWidth);
          containerHeight = containerWidth / imgRatio;
          
          if (containerHeight > maxModalHeight) {
            containerHeight = maxModalHeight;
            containerWidth = containerHeight * imgRatio;
          }
        } else {
          // 竖向图片
          containerHeight = Math.min(maxModalHeight, imgHeight);
          containerWidth = containerHeight * imgRatio;
          
          if (containerWidth > maxModalWidth) {
            containerWidth = maxModalWidth;
            containerHeight = containerWidth / imgRatio;
          }
        }
        
        // 设置最小宽度
        containerWidth = Math.max(containerWidth, 300);
        
        // 应用计算后的尺寸
        modalContainer.style.maxWidth = `${Math.round(containerWidth)}px`;
        modalContainer.style.width = `${Math.round(containerWidth)}px`;
      };
      
      // 显示图片
      modalImg.onload = () => {
        modalImg.style.display = 'block';
        loadingElement.style.display = 'none';
        imageCache[img.url] = true;
      };
      
      // 图片加载失败处理
      modalImg.onerror = () => {
        loadingElement.innerHTML = '<p>图片加载失败</p>';
      };
      
      // 在关闭模态框时移除窗口大小变化监听
      const originalCloseModal = closeModal;
      closeModal = function() {
        window.removeEventListener('resize', resizeHandler);
        originalCloseModal();
      };
      
      // 预加载相邻图片
      preloadAdjacentImages(currentImageIndex);
    };
    
    // 图片加载失败处理
    tempImg.onerror = () => {
      // 创建一个基本的模态框，显示加载失败信息
      imageModal.innerHTML = `
        <div class="modal-container modal-image-only">
          <div class="modal-header">
            <div class="modal-title">${img.filename}</div>
            <button class="modal-close">&times;</button>
          </div>
          <div class="modal-body">
            <div class="image-preview">
              <p>图片加载失败</p>
            </div>
          </div>
        </div>
      `;
      
      imageModal.classList.add('show');
      
      const closeBtn = imageModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeModal);
    };
    
    // 开始加载图片
    tempImg.src = img.url;
  }
  
  function closeModal() {
    if (imageModal) {
      imageModal.classList.remove('show');
      if (keyNavigationListener) {
        document.removeEventListener('keydown', keyNavigationListener);
        keyNavigationListener = null;
      }
    }
  }
  
  function preloadAdjacentImages(index) {
    if (!window.galleryImages || window.galleryImages.length <= 1) return;
    
    const prevIndex = (index - 1 + window.galleryImages.length) % window.galleryImages.length;
    const nextIndex = (index + 1) % window.galleryImages.length;
    
    preloadImage(window.galleryImages[prevIndex].url);
    preloadImage(window.galleryImages[nextIndex].url);
  }
  
  function preloadImage(url) {
    if (!imageCache[url]) {
      const img = new Image();
      img.onload = () => {
        imageCache[url] = true;
      };
      img.src = url;
    }
  }
  
  function navigatePrev() {
    if (!window.galleryImages || window.galleryImages.length <= 1) return;
    
    const prevIndex = (currentImageIndex - 1 + window.galleryImages.length) % window.galleryImages.length;
    currentImageIndex = prevIndex;
    showImageModal(window.galleryImages[prevIndex]);
    const preprevIndex = (prevIndex - 1 + window.galleryImages.length) % window.galleryImages.length;
    preloadImage(window.galleryImages[preprevIndex].url);
  }
  
  function navigateNext() {
    if (!window.galleryImages || window.galleryImages.length <= 1) return;
    
    const nextIndex = (currentImageIndex + 1) % window.galleryImages.length;
    currentImageIndex = nextIndex;
    showImageModal(window.galleryImages[nextIndex]);
    const nextnextIndex = (nextIndex + 1) % window.galleryImages.length;
    preloadImage(window.galleryImages[nextnextIndex].url);
  }
  
  // 格式化文件大小辅助函数
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // 点击页面空白部分时隐藏上下文菜单并取消已选中的图片
  document.addEventListener('click', (e) => {
    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu && contextMenu.style.display === 'block') {
      contextMenu.style.display = 'none';
    }
    if (!e.target.closest('.gallery-item') && !e.target.closest('.context-menu')) {
      clearAllSelections();
    }
  });
  
  // 修改：去掉Delete键删除功能，只提示使用删除按钮
  document.addEventListener('keydown', (e) => {
    // 如果当前焦点在输入框等表单元素中，则不处理
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
    // 若模态框处于显示状态，也不处理（以免影响模态框内部导航）
    if (imageModal && imageModal.classList.contains('show')) return;
    
    if (e.key === 'Delete') {
      if (selectedIndices.length > 0) {
        // 只提示用户使用删除按钮
        showToast('请使用删除按钮删除图片', 'info');
      }
    }
  });
  
  // 加载存储统计信息并更新下拉选项
  async function loadStorageStats() {
    try {
      const res = await fetch('/api/storage-stats');
      const result = await res.json();
      
      if (result.success && storageFilter) {
        const stats = result.stats;
        const options = storageFilter.querySelectorAll('option');
        
        // 更新选项显示数量
        options.forEach(option => {
          const value = option.value;
          if (value === '') {
            option.textContent = `所有图片 (${stats.total})`;
          } else if (value === 'local') {
            option.textContent = `本地存储 (${stats.local})`;
          } else if (value === 'r2') {
            option.textContent = `R2存储 (${stats.r2})`;
          }
        });
      }
    } catch (error) {
      console.error('加载存储统计失败:', error);
    }
  }

  // 页面加载时初始化图片库
  loadGalleryPaged();
  
  // 提示消息功能
  function showToast(message, type = 'success', duration = 3000) {
    if (window.showToast) {
      window.showToast(message, type, duration);
    } else {
      alert(message);
    }
  }
  
  // 全局变量用于图片模态框事件处理
  let imageModal = null;
  let keyNavigationListener = null;
  
  // 处理批量删除操作
  async function handleBatchDelete() {
    const selectedImages = Array.from(document.querySelectorAll('.gallery-item.selected'));
    
    if (selectedImages.length === 0) {
      showToast('请先选择要删除的图片', 'info');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${selectedImages.length} 张图片吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      // 准备待删除的图片数据
      const selectedImageIndices = selectedImages.map(item => parseInt(item.dataset.index));
      
      // 确保window.galleryImages存在且有效
      if (!window.galleryImages || !Array.isArray(window.galleryImages)) {
        showToast('图片数据无效，请刷新页面', 'error');
        return;
      }
      
      // 获取图片对象
      const imagesToDelete = selectedImageIndices
        .map(index => window.galleryImages[index])
        .filter(img => img && img.storage && img.path); // 确保图片有必要的属性
      
      if (imagesToDelete.length === 0) {
        showToast('选中的图片无法删除', 'error');
        return;
      }
      
      console.log('准备删除图片:', imagesToDelete);
      
      // 发送正确的删除请求
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images: imagesToDelete })
      });
      
      const result = await res.json();
      
      if (result.success) {
        showToast('图片删除成功', 'success');
        loadGalleryPaged(); // 重新加载当前页
        clearAllSelections(); // 清除选择
        // 重新加载存储统计
        loadStorageStats();
      } else {
        showToast('删除图片失败：' + (result.message || '未知错误'), 'error');
      }
    } catch (err) {
      console.error('删除图片时出错：', err);
      showToast('删除图片时发生错误', 'error');
    }
  }

  // 处理单张图片删除操作
  async function handleSingleImageDelete(img, index) {
    if (!img || !img.storage || !img.path) {
      showToast('图片信息无效，无法删除', 'error');
      return;
    }
    
    // 确认删除
    if (!confirm(`确定要删除图片 "${img.filename}" 吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      console.log('准备删除单张图片:', img);
      
      // 发送删除请求
      const res = await fetch('/api/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ images: [img] })
      });
      
      const result = await res.json();
      
      if (result.success) {
        showToast('图片删除成功', 'success');
        loadGalleryPaged(); // 重新加载当前页
        // 重新加载存储统计
        loadStorageStats();
      } else {
        showToast('删除图片失败：' + (result.message || '未知错误'), 'error');
      }
    } catch (err) {
      console.error('删除图片时出错：', err);
      showToast('删除图片时发生错误', 'error');
    }
  }
});