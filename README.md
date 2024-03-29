<a href="https://www.crownpeak.com" target="_blank">![Crownpeak Logo](https://github.com/Crownpeak/DXM-SDK-Core/raw/master/images/crownpeak-logo.png?raw=true "Crownpeak Logo")</a>

# Crownpeak Digital Experience Management (DXM) Software Development Kit (SDK) Core
Crownpeak Digital Experience Management (DXM) Software Development Kits (SDK) have been constructed to assist
the Single Page App developer in developing client-side applications that leverage DXM for content management purposes.

## Version History
 
| Version       | Date          | Changes                            |
| ------------- | --------------|----------------------------------- |
| 0.1.1         | 2020MAY11     | Initial Release.                   |
| 0.1.2         | 2020JUN03     | Override for CmsField value        |
| 0.1.3         | 2020JUN03     | Add HREF to CmsFieldTypes          |
| 2.0.0         | 2020JUN30     | Migrated to TypeScript.            |
| 2.1.0         | 2020JUL28     | New 'init', 'patch' and 'scaffold' options, improved output, lots of bug fixes. |
| 2.1.1         | 2020JUL29     | Fix for missing XML patch file.    |
| 2.2.0         | 2020SEP03     | Add support for indexed fields.    |
| 2.3.0         | 2020OCT01     | Preserve paths for uploads, support uploads from pages and wrappers. Bug fixes. |
| 2.4.0         | 2020OCT09     | Improved uploading and relinking, new page and component creation settings, new --only option. Bug fixes. |
| 3.0.0         | 2020NOV06     | Change to asynchronous data loading, drag and drop zone governance, new upgrade method. Bug fixes. |
| 3.1.0         | 2021JAN04     | Add string replacements via .cpscaffold.json. |
| 3.2.0         | 2021JAN07     | Add cp-scaffold for wrappers, option to include metadata on pages, $file macro in CMS_STATIC_CONTENT_LOCATION. |
| 3.2.1         | 2021JAN08     | Extra macro option using {file} in CMS_STATIC_CONTENT_LOCATION. |
| 3.3.0         | 2021JAN13     | Add cmsDisableDragDrop option to mark components unsuitable for Drag and Drop. |
| 3.4.0         | 2021MAR15     | Updates to support Gatsby, extraction of WCO snippets, bug fixes. |
| 3.5.0         | 2021OCT15     | Template Builder supports default template files, preload event for Data Provider, bug fixes. |
| 3.5.1         | 2021OCT27     | Bug fix for error when updating a model inside a project branch. |
| 3.6.0         | 2023-07-10    | Bump DXM Access API helper version to remove vulnerable dependencies. |

## Credit
Thanks to:
* <a href="https://github.com/richard-lund" target="_blank">Richard Lund</a> for the refactoring;
* <a href="https://github.com/ptylr" target="_blank">Paul Taylor</a> for a few edits ;)
* <a href="https://github.com/marcusedwards-cp" target="_blank">Marcus Edwards</a> for the 'init' and 'parse' modules
 
## License
MIT License

Copyright (c) 2021 Crownpeak Technology, inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
