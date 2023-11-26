// ==UserScript==
// @name         Bandcamp Helper
// @namespace    V.L
// @version      1.2.0
// @description  Improve downloading of discographies with the addition of an item count and total size.
// @author       Valerio Lyndon
// @match        https://bandcamp.com/download*
// @match        https://*.bandcamp.com/*
// @grant        none
// @license      AGPL-3.0-or-later
// ==/UserScript==

const url = new URL(window.location);

function style( css ){
	const element = document.createElement('style');
	element.textContent = css;
	document.documentElement.append(element);
}

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

class Discography {
	constructor( ){
		this.items = Array.from(document.getElementsByClassName('music-grid-item'));

		style(`
			.vl-price-tag {
				position: absolute;
				bottom: 4px;
				right: 4px;
				padding: 2px;
				background: rgba(0,0,0,0.7);
				border-radius: 2px;
				color: #fff;
				font-weight: bold;
				text-shadow: 0 0 5px rgb(0,0,0,0.7);
			}
		`);

		this.lazyLoadItems(0);
	}

	async lazyLoadItems( index ){
		console.log('lazyLoad');
		const item = this.items[index];
		const url = item.getElementsByTagName('a')[0].href;
		const price = await this.getPrice(url);
		let tag = document.createElement('span');
		tag.className = `vl-price-tag`;
		tag.textContent = price;
		item.getElementsByClassName('art')[0].append(tag);

		const delay = 50*(1+(index*0.15));
		setTimeout(()=>{
			this.lazyLoadItems(index+1);
		}, delay);
	}

	async getPrice( url ){
		console.log('price');
		let price = 'unknown price';
		try {
			const page = await fetch(url);
			const text = await page.text();
			const parser = new DOMParser();
			const dom = parser.parseFromString(text, 'text/html');

			const span = dom.querySelector('.buy-link ~ span');
			if( span === null ){
				price = 'not for sale';
			}
			if( span.className.includes('buyItemExtra') ){
				price = 'free';
			}
			else if( span.childElementCount > 0 ){
				const quantity = span.querySelector('.base-text-color').textContent;
				const currency = span.querySelector('.secondaryText').textContent;
				console.log(quantity,currency);
				price = `${quantity} ${currency}`;
			}
		}
		catch {
			false;
		}
		return price;
	}
}


// Download pages
if( url.pathname.startsWith('/download') ){
	document.querySelector('.bfd-download-dropdown').addEventListener('click', ()=>{ new MassDownload(); });
}

// Discographies
if( (url.hostname.match(/\./g) || []).length === 2 && url.pathname === '/' ){
	new Discography();
}