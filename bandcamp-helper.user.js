// ==UserScript==
// @name         Bandcamp Helper
// @namespace    V.L
// @version      1.1.0
// @description  Improve downloading of discographies with the addition of an item count and total size.
// @author       Valerio Lyndon
// @match        https://bandcamp.com/download*
// @grant        none
// @license      AGPL-3.0-or-later
// ==/UserScript==

class MassDownload {
	constructor( ){
		this.wrapper = document.createElement('li');
		this.paragraph = document.createElement('p');
		this.wrapper.append(this.paragraph);
		document.querySelector('.download_list').prepend(this.wrapper);
		this.dropdowns = document.querySelectorAll('select#format-type');
		for( let dropdown of this.dropdowns ){
			dropdown.addEventListener('change', ()=>{
				this.calculateBytes();
			});
		}
		this.calculateBytes();
	}

	calculateBytes( ){
		let totalBytes = 0;
		let totalItems = this.dropdowns.length;
		for( let dropdown of this.dropdowns ){
			dropdown.addEventListener('change', this.calculateBytes);
			let selected = false;
			for( let opt of dropdown.getElementsByTagName('option') ){
				if( opt && opt.selected ){
					selected = opt;
				}
			}
			if( !selected ){
				console.log('skipping 1 entry due to unknown format');
				continue;
			}
			let match = selected.textContent.match(/([\d\.]+)([A-Za-z][bB])/);
			let bytes = Number(match[1]);
			let byteFormat = match[2];
			switch( byteFormat.toUpperCase() ){
				case 'TB':
					bytes *= 1024;
				case 'GB':
					bytes *= 1024;
				case 'MB':
					bytes *= 1024;
				case 'KB':
					bytes *= 1024;
			}

			totalBytes += bytes;
		}

		function formatBytes( bytes ){
			let format = 'B';
			if( bytes / 1024 >= 1 ){
				bytes /= 1024;
				format = 'KiB';
			}
			if( bytes / 1024 >= 1 ){
				bytes /= 1024;
				format = 'MiB';
			}
			if( bytes / 1024 >= 1 ){
				bytes /= 1024;
				format = 'GiB';
			}
			if( bytes / 1024 >= 1 ){
				bytes /= 1024;
				format = 'TiB';
			}
			// round to two decimal places
			bytes = Math.round(bytes*100) / 100;
			return `${bytes}${format}`;
		}

		this.paragraph.textContent = `Total download size for ${totalItems} items of selected quality is ${formatBytes(totalBytes)}`;
	}
}

document.querySelector('.bfd-download-dropdown').addEventListener('click', ()=>{ new MassDownload(); });

